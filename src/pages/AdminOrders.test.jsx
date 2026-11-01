import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../services/api';
import AdminOrders from './AdminOrders';

vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

/** automate-delivery-confirmation-and-lost-shipments: a aba "Enviados sem confirmação" (lista, lote, extravio) e o botão de reabrir repasse. */
const A = '/api/v1/admin';
const ENVIADO = (id, extra = {}) => ({ id, pedido_id: 100 + id, status: 'ENVIADO', enviado_em: '2026-10-01T12:00:00Z', dias_enviado: 20, rastreio_codigo: `BR${id}`, transportadora: 'Correios', rastreio_status: null, alerta_envio_atrasado_em: null, loja_nome: 'Loja A', ...extra });
let shipped; let payouts;

beforeEach(() => {
    vi.clearAllMocks();
    shipped = [ENVIADO(1), ENVIADO(2, { alerta_envio_atrasado_em: '2026-10-20T00:00:00Z' }), ENVIADO(3, { status: 'EXTRAVIADO' })];
    payouts = { totais: {}, repasses: [], debitos_abertos: [], total_debitos: 0 };
    api.get.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/orders/shipped') ? shipped : url.endsWith('/payouts') ? payouts : [] }));
    api.post.mockResolvedValue({ data: {} });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const abrirAba = async (nome) => { render(<AdminOrders />); await userEvent.click(await screen.findByRole('tab', { name: nome })); };
const linha = (id) => document.querySelector(`[data-shipped-row="${id}"]`);

describe('aba de enviados sem confirmação', () => {
    it('mostra a contagem na aba, os dias, o rastreio e o destaque de cada caso; extraviado não tem caixa de seleção', async () => {
        await abrirAba(/Enviados sem confirmação/);
        expect(screen.getByRole('tab', { name: 'Enviados sem confirmação (3)' })).toBeTruthy();
        expect(within(linha(1)).getByText('há 20 dias')).toBeTruthy();
        expect(within(linha(1)).getByText('BR1')).toBeTruthy();
        expect(linha(1).querySelector('[data-shipped-attention]')).toBeNull();
        expect(linha(2).querySelector('[data-shipped-attention="warning"]')?.textContent).toMatch(/muito tempo/);
        expect(linha(3).querySelector('[data-shipped-attention="error"]')?.textContent).toMatch(/Extraviado/);
        expect(within(linha(3)).queryByRole('checkbox')).toBeNull();
        expect(within(linha(1)).getByRole('checkbox')).toBeTruthy();
    });

    it('lote: o botão só vale com seleção; "selecionar todos" marca só os enviados; envia os ids e mostra o resultado', async () => {
        api.post.mockResolvedValueOnce({ data: { resultados: [{ id: 1, resultado: 'ENTREGUE' }, { id: 2, resultado: 'ENTREGUE' }] } });
        await abrirAba(/Enviados sem confirmação/);
        const lote = document.querySelector('[data-confirm-batch]');
        expect(lote.disabled).toBe(true);
        await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todos os enviados' }));
        expect(lote.textContent).toMatch(/\(2\)/); // o extraviado não entra
        await userEvent.click(lote);
        await waitFor(() => expect(api.post).toHaveBeenCalledWith(`${A}/orders/deliver-batch`, { ids: [1, 2] }));
        await waitFor(() => expect(screen.getByText('2 entregas confirmadas.')).toBeTruthy());
    });

    it('recusa parcial é erro visível, com o motivo de cada uma, e não sucesso', async () => {
        api.post.mockResolvedValueOnce({ data: { resultados: [{ id: 1, resultado: 'ENTREGUE' }, { id: 2, resultado: 'RECUSADO', motivo: 'Sub-pedido ENTREGUE não aceita novas transições.' }] } });
        await abrirAba(/Enviados sem confirmação/);
        await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todos os enviados' }));
        await userEvent.click(document.querySelector('[data-confirm-batch]'));
        const alerta = await screen.findByText(/1 recusada: #2/);
        expect(alerta.closest('[role="alert"]')).toBeTruthy();
    });

    it('sem confirmar na janela do navegador, nada é enviado', async () => {
        window.confirm.mockReturnValue(false);
        await abrirAba(/Enviados sem confirmação/);
        await userEvent.click(within(linha(1)).getByRole('checkbox'));
        await userEvent.click(document.querySelector('[data-confirm-batch]'));
        expect(api.post).not.toHaveBeenCalled();
    });

    it('marcar extraviado exige o motivo (mínimo 3 letras) e o envia ao servidor', async () => {
        await abrirAba(/Enviados sem confirmação/);
        await userEvent.click(within(linha(1)).getByRole('button', { name: 'Marcar extraviado' }));
        const dialogo = await screen.findByRole('dialog');
        const confirmar = within(dialogo).getByRole('button', { name: 'Marcar extraviado' });
        expect(confirmar.disabled).toBe(true);
        await userEvent.type(within(dialogo).getByLabelText('Motivo'), 'ab');
        expect(confirmar.disabled).toBe(true);
        await userEvent.type(within(dialogo).getByLabelText('Motivo'), 'c perdido');
        await userEvent.click(confirmar);
        await waitFor(() => expect(api.post).toHaveBeenCalledWith(`${A}/orders/1/lost`, { motivo: 'abc perdido' }));
    });

    it('extraviado: "encontrado" confirma a entrega e "cancelar" reembolsa, cada um com o aviso do que acontece', async () => {
        await abrirAba(/Enviados sem confirmação/);
        await userEvent.click(within(linha(3)).getByRole('button', { name: 'Encontrado (entregue)' }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith(`${A}/orders/3/deliver`));
        await userEvent.click(within(linha(3)).getByRole('button', { name: 'Cancelar e reembolsar' }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith(`${A}/orders/3/cancel`, { motivo: 'Extravio confirmado' }));
        expect(window.confirm.mock.calls.at(-1)[0]).toMatch(/reembolsado integralmente.*estoque NÃO volta/);
    });

    it('lista vazia e falha só da consulta de enviados não derrubam a tela', async () => {
        shipped = [];
        await abrirAba(/Enviados sem confirmação/);
        expect(screen.getByText('Nenhum enviado sem confirmação')).toBeTruthy();
        cleanup();
        api.get.mockImplementation((url) => (url.endsWith('/orders/shipped') ? Promise.reject(new Error('404')) : Promise.resolve({ data: url.endsWith('/payouts') ? payouts : [] })));
        await abrirAba(/Enviados sem confirmação/);
        expect(screen.getByText('Nenhum enviado sem confirmação')).toBeTruthy();
        expect(screen.queryByRole('alert')).toBeNull();
    });
});

describe('repasse que falhou', () => {
    it('o botão Reabrir só existe no repasse em FALHA, mostra as tentativas e o erro, e chama a rota depois de confirmar', async () => {
        payouts = { totais: {}, debitos_abertos: [], total_debitos: 0, repasses: [
            { id: 7, subpedido_id: 1, beneficiario_tipo: 'PRODUTOR', status: 'FALHA', valor: 200, tentativas: 8, ultimo_erro: 'stripe fora do ar', liberar_apos: null, liberado_em: null },
            { id: 8, subpedido_id: 1, beneficiario_tipo: 'DROPSHIPPER', status: 'LIBERADO', valor: 310, tentativas: 0, ultimo_erro: null, liberado_em: '2026-10-30T00:00:00Z' },
        ] };
        await abrirAba(/Comissões e repasses/);
        expect(document.querySelector('[data-payout-reopen="8"]')).toBeNull();
        expect(document.querySelector('[data-payout-error]')?.textContent).toBe('8 tentativas: stripe fora do ar');
        await userEvent.click(document.querySelector('[data-payout-reopen="7"]'));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith(`${A}/payouts/7/reopen`));
        expect(window.confirm.mock.calls.at(-1)[0]).toMatch(/Reabrir o repasse #7/);
    });
});
