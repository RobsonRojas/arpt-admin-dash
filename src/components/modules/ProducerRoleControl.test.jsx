import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../services/api';
import { ProducerRoleControl } from './ProducerRoleControl';

vi.mock('../../services/api', () => ({ api: { get: vi.fn(), put: vi.fn() } }));

/** add-producer-role-self-service (3.3): o detalhe do usuário mostra o papel `produtor` e o administrador concede ou retira. */
const ID = '11111111-2222-4333-8444-555555555555';
const getToken = vi.fn(async () => 'tk');
const abrir = () => render(<ProducerRoleControl userId={ID} getToken={getToken} />);
const interruptor = () => screen.getByRole('checkbox', { name: /Pode fornecer produtos/ });

beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { proprietario: true, produtor: false } });
    api.put.mockImplementation((_u, body) => Promise.resolve({ data: { produtor: body.enabled } }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('ProducerRoleControl', () => {
    it('lê os papéis do usuário, com o token do administrador, e mostra o estado', async () => {
        abrir();
        expect(await screen.findByText('Sem papel de produtor')).toBeTruthy();
        expect(screen.getByText('Proprietário')).toBeTruthy();
        expect(api.get).toHaveBeenCalledWith(`/admin/users/${ID}/roles`, { headers: { Authorization: 'Bearer tk' } });
        expect(interruptor().checked).toBe(false);
    });

    it('conceder envia enabled true, sem confirmação, e passa a mostrar produtor ativo', async () => {
        abrir();
        await userEvent.click(await screen.findByRole('checkbox', { name: /Pode fornecer produtos/ }));
        await screen.findByText('Produtor ativo');
        expect(api.put).toHaveBeenCalledWith(`/admin/users/${ID}/producer-role`, { enabled: true }, { headers: { Authorization: 'Bearer tk' } });
        expect(window.confirm).not.toHaveBeenCalled();
    });

    it('retirar pede confirmação; cancelar não envia nada', async () => {
        api.get.mockResolvedValue({ data: { proprietario: false, produtor: true } });
        window.confirm.mockReturnValue(false);
        abrir();
        await userEvent.click(await screen.findByRole('checkbox', { name: /Pode fornecer produtos/ }));
        expect(window.confirm).toHaveBeenCalledTimes(1);
        expect(api.put).not.toHaveBeenCalled();
        expect(screen.getByText('Produtor ativo')).toBeTruthy();
    });

    it('retirar confirmado envia enabled false', async () => {
        api.get.mockResolvedValue({ data: { proprietario: false, produtor: true } });
        abrir();
        await userEvent.click(await screen.findByRole('checkbox', { name: /Pode fornecer produtos/ }));
        await screen.findByText('Sem papel de produtor');
        expect(api.put).toHaveBeenCalledWith(`/admin/users/${ID}/producer-role`, { enabled: false }, expect.anything());
    });

    it('falha na alteração mostra o erro do servidor e mantém o estado anterior', async () => {
        api.put.mockRejectedValue({ response: { data: { error: 'O grupo "produtor" não existe no Keycloak.' } } });
        abrir();
        await userEvent.click(await screen.findByRole('checkbox', { name: /Pode fornecer produtos/ }));
        expect((await screen.findByText(/não existe no Keycloak/))).toBeTruthy();
        expect(screen.getByText('Sem papel de produtor')).toBeTruthy();
        expect(interruptor().checked).toBe(false);
    });

    it('falha ao ler os papéis mostra o erro e não oferece o interruptor', async () => {
        api.get.mockRejectedValue(new Error('rede'));
        abrir();
        expect(await screen.findByText(/Não foi possível ler os papéis/)).toBeTruthy();
        expect(screen.queryByRole('checkbox')).toBeNull();
    });

    it('trocar de usuário recarrega os papéis', async () => {
        const { rerender } = abrir();
        await screen.findByText('Sem papel de produtor');
        api.get.mockResolvedValue({ data: { proprietario: false, produtor: true } });
        rerender(<ProducerRoleControl userId="99999999-2222-4333-8444-555555555555" getToken={getToken} />);
        await waitFor(() => expect(screen.getByText('Produtor ativo')).toBeTruthy());
        expect(api.get).toHaveBeenCalledTimes(2);
    });
});
