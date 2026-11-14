import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../services/api';
import { SocialLogin } from './SocialLogin';

vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

const item = (o) => ({ grupo: 'Keycloak', titulo: 'T', descricao: 'D', tipo: 'automatico', gravidade: 'bloqueante', estado: 'ok', acao: 'Faça X', detalhe: '', ...o });
const PRONTO = { interruptores: { site: false, lojas: false }, pronto: true, pendencias: 0, itens: [item({ id: 'kc-provedor', titulo: 'Provedor criado' })] };
const FALHO = { interruptores: { site: false, lojas: false }, pronto: false, pendencias: 2, itens: [
    item({ id: 'kc-opcoes', titulo: 'Opções do provedor', estado: 'falha', detalhe: 'Trust Email desligado', acao: 'Ligar Trust Email' }),
    item({ id: 'g-consentimento', grupo: 'Google Cloud', titulo: 'Tela de consentimento publicada', tipo: 'manual', estado: 'pendente', acao: 'Publicar no Google Cloud' }),
    item({ id: 'p-sonda', grupo: 'Plataforma', titulo: 'Teste de ida ao Google', gravidade: 'aviso', estado: 'inconclusivo' }),
] };
beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

describe('Login social (painel)', () => {
    it('lista todos os itens com descrição, o que lido e o que fazer, agrupados', async () => {
        api.get.mockResolvedValue({ data: FALHO });
        render(<SocialLogin />);
        expect(await screen.findByText('Opções do provedor')).toBeTruthy();
        expect(screen.getByText(/Trust Email desligado/)).toBeTruthy();
        expect(screen.getByText(/Ligar Trust Email/)).toBeTruthy();
        expect(screen.getByText(/Publicar no Google Cloud/)).toBeTruthy();
        expect(screen.getByTestId('item-p-sonda').dataset.estado).toBe('inconclusivo');
        expect(screen.getByTestId('resumo').textContent).toMatch(/2 item/);
        for (const g of ['Google Cloud', 'Keycloak', 'Plataforma']) expect(screen.getByRole('heading', { name: g })).toBeTruthy();
    });

    it('ligar com itens pendentes: o servidor recusa (409) e a tela mostra a lista atualizada sem ligar', async () => {
        api.get.mockResolvedValue({ data: PRONTO });
        api.put.mockRejectedValue({ response: { status: 409, data: { ...FALHO, itens: FALHO.itens } } });
        render(<SocialLogin />);
        await userEvent.click(await screen.findByRole('checkbox', { name: /Google em arpt\.site/ }));
        expect(await screen.findByText(/Não foi ligado: 2 item/)).toBeTruthy();
        expect(screen.getByText('Opções do provedor')).toBeTruthy();
        expect(screen.getByRole('checkbox', { name: /Google em arpt\.site/ }).checked).toBe(false);
        expect(api.put).toHaveBeenCalledWith('/api/v1/admin/social-login/site', { ligado: true });
    });

    it('ligar com tudo ok liga; desligar também chama a API', async () => {
        api.get.mockResolvedValue({ data: PRONTO });
        api.put.mockResolvedValueOnce({ data: { interruptores: { site: false, lojas: true } } }).mockResolvedValueOnce({ data: { interruptores: { site: false, lojas: false } } });
        render(<SocialLogin />);
        const sw = await screen.findByRole('checkbox', { name: /Google em Lojas/ });
        await userEvent.click(sw);
        await waitFor(() => expect(screen.getByRole('checkbox', { name: /Google em Lojas/ }).checked).toBe(true));
        await userEvent.click(screen.getByRole('checkbox', { name: /Google em Lojas/ }));
        await waitFor(() => expect(api.put).toHaveBeenLastCalledWith('/api/v1/admin/social-login/lojas', { ligado: false }));
    });

    it('item manual: "Já fiz" registra a confirmação e atualiza a lista', async () => {
        api.get.mockResolvedValue({ data: FALHO });
        api.put.mockResolvedValue({ data: { pronto: false, pendencias: 1, itens: [FALHO.itens[0], { ...FALHO.itens[1], estado: 'ok', confirmado_por: 'adm-1', confirmado_em: '2026-11-14T10:00:00Z' }, FALHO.itens[2]] } });
        render(<SocialLogin />);
        const cx = await screen.findByRole('checkbox', { name: 'Já fiz' });
        await userEvent.click(cx);
        expect(api.put).toHaveBeenCalledWith('/api/v1/admin/social-login/confirmacoes/g-consentimento', { confirmado: true });
        expect(await screen.findByText(/por adm-1/)).toBeTruthy();
    });

    it('"Verificar agora" refaz a verificação sem ligar nada', async () => {
        api.get.mockResolvedValue({ data: FALHO });
        api.post.mockResolvedValue({ data: PRONTO });
        render(<SocialLogin />);
        await userEvent.click(await screen.findByRole('button', { name: 'Verificar agora' }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/v1/admin/social-login/verificar'));
        expect(api.put).not.toHaveBeenCalled();
        expect(await screen.findByText(/é possível ligar/)).toBeTruthy();
    });

    it('erro ao carregar mostra a mensagem', async () => {
        api.get.mockRejectedValue({ response: { data: { message: 'Sem acesso' } } });
        render(<SocialLogin />);
        expect(await screen.findByText('Sem acesso')).toBeTruthy();
    });
});
