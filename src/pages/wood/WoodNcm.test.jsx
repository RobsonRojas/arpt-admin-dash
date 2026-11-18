import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../services/api';
import { WoodNcm } from './WoodNcm';
import { formatarNcm, normalizarNcm } from '../../utils/wood';

vi.mock('../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

const ITENS = [
    { uso: 'DECORACAO', ncm: '4420', ncm_formatado: '4420', descricao_pt: 'Enfeites', editado: false },
    { uso: 'MOVEL', ncm: '9403', ncm_formatado: '9403', descricao_pt: 'Móveis', editado: false },
    { uso: 'UTENSILIO_COZINHA', ncm: '44199000', ncm_formatado: '4419.90.00', descricao_pt: null, editado: true, updated_at: '2026-11-18T12:00:00Z' },
    { uso: 'BRINQUEDO', ncm: '9503', ncm_formatado: '9503', descricao_pt: 'Brinquedos', editado: false },
    { uso: 'OUTRO', ncm: '4421', ncm_formatado: '4421', descricao_pt: null, editado: false },
];

describe('formato do NCM no painel (mesma regra do servidor)', () => {
    it.each([['4420', '4420'], ['4420.90', '442090'], ['4420.90.00', '44209000'], [' 44209000 ', '44209000']])('aceita %s', (e, s) => { expect(normalizarNcm(e)).toBe(s); });
    it.each(['', '442', '44201', '4420900', '123456789', '44a0', '4420.9.00.1'])('recusa "%s"', (e) => { expect(normalizarNcm(e)).toBeNull(); });
    it('mostra com pontos', () => { expect([formatarNcm('44209000'), formatarNcm('442090'), formatarNcm('4420')]).toEqual(['4420.90.00', '4420.90', '4420']); });
});

describe('aba NCM por peça', () => {
    const abrir = async () => {
        api.get.mockResolvedValue({ data: { itens: ITENS } });
        render(<WoodNcm />);
        await screen.findByTestId('ncm-DECORACAO');
    };

    it('lista todos os tipos, e marca o que já foi editado', async () => {
        await abrir();
        for (const i of ITENS) expect(screen.getByTestId(`ncm-${i.uso}`)).toBeTruthy();
        expect(within(screen.getByTestId('ncm-UTENSILIO_COZINHA')).getByText('4419.90.00')).toBeTruthy();
        expect(within(screen.getByTestId('ncm-UTENSILIO_COZINHA')).getByText(/Editado em/)).toBeTruthy();
        expect(within(screen.getByTestId('ncm-DECORACAO')).getByText('Valor de partida')).toBeTruthy();
        expect(within(screen.getByTestId('ncm-BRINQUEDO')).getByText(/ainda não vendável/)).toBeTruthy();
    });

    it('código inválido e motivo em branco não chamam a API', async () => {
        await abrir();
        await userEvent.click(within(screen.getByTestId('ncm-DECORACAO')).getByRole('button', { name: 'Editar' }));
        const campo = await screen.findByLabelText('NCM');
        await userEvent.clear(campo); await userEvent.type(campo, '44');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
        await screen.findByText(/Informe 4, 6 ou 8 dígitos/);
        await userEvent.clear(campo); await userEvent.type(campo, '4420.90.00');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
        await screen.findByText(/Informe o motivo/);
        expect(api.put).not.toHaveBeenCalled();
    });

    it('envia só os dígitos com o motivo, mostra quantas declarações mudaram e recarrega a lista', async () => {
        await abrir();
        api.put.mockResolvedValue({ data: { uso: 'DECORACAO', ncm: '44209000', ncm_formatado: '4420.90.00', declaracoes_atualizadas: 3 } });
        await userEvent.click(within(screen.getByTestId('ncm-DECORACAO')).getByRole('button', { name: 'Editar' }));
        const campo = await screen.findByLabelText('NCM');
        await userEvent.clear(campo); await userEvent.type(campo, '4420.90.00');
        await userEvent.type(screen.getByLabelText('Motivo da alteração'), 'Despachante confirmou');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
        await waitFor(() => expect(api.put).toHaveBeenCalledWith('/api/v1/admin/wood/ncm/DECORACAO', { ncm: '44209000', motivo: 'Despachante confirmou' }));
        expect(await screen.findByText(/agora é 4420\.90\.00\. 3 declaração\(ões\) atualizada\(s\)/)).toBeTruthy();
        expect(api.get).toHaveBeenCalledTimes(2);
    });

    it('mostra o erro do servidor e mantém o diálogo aberto', async () => {
        await abrir();
        api.put.mockRejectedValue({ response: { data: { code: 'NCM_UNCHANGED', error: 'O NCM já é esse.' } } });
        await userEvent.click(within(screen.getByTestId('ncm-MOVEL')).getByRole('button', { name: 'Editar' }));
        await userEvent.type(await screen.findByLabelText('Motivo da alteração'), 'Teste');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
        expect(await screen.findByText('O NCM já é esse.')).toBeTruthy();
        expect(screen.getByLabelText('NCM')).toBeTruthy();
    });
});
