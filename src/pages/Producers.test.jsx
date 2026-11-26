import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../services/api';
import { Producers } from './Producers';

vi.mock('../services/api', () => ({ api: { get: vi.fn() } }));
const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

const LISTA = { data: [
    { id: 'u1', nome: 'Ana Souza', email: 'ana@p.test', is_active: true, produtos_total: 3, produtos_ativos: 2, produtos_sem_frete: 1 },
    { id: 'u2', nome: 'Bia Lima', email: 'bia@p.test', is_active: false, produtos_total: 0, produtos_ativos: 0, produtos_sem_frete: 0 },
], page: 1, limit: 20, total: 2 };

beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);
const abrir = () => render(<MemoryRouter><Producers /></MemoryRouter>);

describe('Produtores (lista)', () => {
    it('mostra os produtores com contagens', async () => {
        api.get.mockResolvedValue({ data: LISTA });
        abrir();
        await screen.findByText('Ana Souza');
        expect(screen.getByText('bia@p.test')).toBeTruthy();
        expect(screen.getByText('inativo')).toBeTruthy();
        expect(api.get).toHaveBeenCalledWith('/api/v1/admin/producers', { params: { q: undefined, page: 1, limit: 20 } });
    });

    it('busca por nome ou e-mail volta à primeira página', async () => {
        api.get.mockResolvedValue({ data: LISTA });
        abrir();
        await screen.findByText('Ana Souza');
        await userEvent.type(screen.getByLabelText(/Buscar por nome ou e-mail/i), ' ana ');
        await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
        await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/api/v1/admin/producers', { params: { q: 'ana', page: 1, limit: 20 } }));
    });

    it('abre o detalhe do produtor', async () => {
        api.get.mockResolvedValue({ data: LISTA });
        abrir();
        await userEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Ana Souza' }));
        expect(navigate).toHaveBeenCalledWith('/dropshipping-admin/produtores/u1');
    });

    it('lista vazia e erro com nova tentativa', async () => {
        api.get.mockResolvedValueOnce({ data: { data: [], page: 1, limit: 20, total: 0 } });
        abrir();
        await screen.findByText('Nenhum produtor encontrado.');
        cleanup();
        api.get.mockRejectedValueOnce({ response: { data: { code: 'KEYCLOAK_UNAVAILABLE' } } }).mockResolvedValueOnce({ data: LISTA });
        abrir();
        await screen.findByText(/serviço de autenticação está indisponível/i);
        await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
        await screen.findByText('Ana Souza');
    });
});
