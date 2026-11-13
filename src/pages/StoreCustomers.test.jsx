import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../services/api';
import { StoreCustomers } from './StoreCustomers';

vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

/** fix-store-modal-shape-and-add-customer-verification-admin (4.2). */
const LOJAS = [{ id: 1, slug: 'acurui', nome: 'Acurui' }];
const NAO_VERIFICADA = { existe: true, email_verificado: false, ativo: true, lojas_vinculadas: [], lojas_disponiveis: LOJAS };

beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

const buscar = async (email = 'ana@cliente.test') => {
    await userEvent.type(screen.getByLabelText(/E-mail do cliente/i), email);
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
};

describe('Clientes de loja', () => {
    it('busca pelo e-mail exato e mostra o estado da conta', async () => {
        api.get.mockResolvedValue({ data: NAO_VERIFICADA });
        render(<StoreCustomers />);
        await buscar();
        await screen.findByText('E-mail não verificado');
        expect(api.get).toHaveBeenCalledWith('/admin/store-customers', { params: { email: 'ana@cliente.test' } });
    });

    it('conta inexistente: informa que não há conta', async () => {
        api.get.mockResolvedValue({ data: { existe: false, lojas_vinculadas: [], lojas_disponiveis: LOJAS } });
        render(<StoreCustomers />);
        await buscar('ninguem@cliente.test');
        await screen.findByText(/Não há conta com o e-mail ninguem@cliente.test/);
    });

    it('reenvia a verificação pela loja escolhida', async () => {
        api.get.mockResolvedValue({ data: NAO_VERIFICADA });
        api.post.mockResolvedValue({ data: { ok: true } });
        render(<StoreCustomers />);
        await buscar();
        await userEvent.click(await screen.findByRole('button', { name: /Reenviar e-mail de verificação/ }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/store-customers/resend-verification', { email: 'ana@cliente.test', slug: 'acurui' }));
        await screen.findByText('E-mail de verificação enviado.');
    });

    it('verificação manual só acontece depois da confirmação; cancelar não chama a API', async () => {
        api.get.mockResolvedValue({ data: NAO_VERIFICADA });
        api.post.mockResolvedValue({ data: { ok: true } });
        render(<StoreCustomers />);
        await buscar();
        await userEvent.click(await screen.findByRole('button', { name: 'Marcar como verificado' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(api.post).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Marcar como verificado' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/store-customers/verify-email', { email: 'ana@cliente.test', confirm: true }));
    });

    it('mostra a falha do servidor (ex.: envio de e-mail)', async () => {
        api.get.mockResolvedValue({ data: NAO_VERIFICADA });
        api.post.mockRejectedValue({ response: { data: { error: 'Não foi possível enviar o e-mail. Confira a configuração de envio.' } } });
        render(<StoreCustomers />);
        await buscar();
        await userEvent.click(await screen.findByRole('button', { name: /Reenviar e-mail de verificação/ }));
        await screen.findByText(/Confira a configuração de envio/);
    });

    it('conta já verificada não oferece as ações', async () => {
        api.get.mockResolvedValue({ data: { ...NAO_VERIFICADA, email_verificado: true } });
        render(<StoreCustomers />);
        await buscar();
        await screen.findByText('E-mail verificado');
        expect(screen.queryByRole('button', { name: /Reenviar/ })).toBeNull();
    });
});
