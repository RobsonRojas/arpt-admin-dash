import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../services/api';
import ImportFromProjectDialog from './ImportFromProjectDialog';

vi.mock('../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const PROJETOS = { data: [{ id: 25, nome: 'projeto-ybiraete', municipio: null, estado: null }] };
// Mesmo produto (18) ligado a duas recompensas do projeto: a lista pode chegar repetida.
const PRODUTOS = { data: [
    { id: 17, nome: 'Ybiraete Clock', preco: 759, foto: null, is_madeira: false, ja_importado: false },
    { id: 18, nome: 'Ybiraete Cutting Board', preco: 329, foto: null, is_madeira: false, ja_importado: false },
    { id: 18, nome: 'Ybiraete Cutting Board', preco: 329, foto: null, is_madeira: false, ja_importado: false },
] };

beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation(async (url) => (url.endsWith('/import-sources/projects') ? { data: PROJETOS } : { data: PRODUTOS }));
});
afterEach(cleanup);

describe('ImportFromProjectDialog', () => {
    it('produto repetido na lista aparece uma vez e marcar um produto não marca o outro', async () => {
        const user = userEvent.setup();
        render(<ImportFromProjectDialog open produtorId="u1" onClose={() => {}} onImported={() => {}} />);
        await user.click(await screen.findByText('projeto-ybiraete'));
        await screen.findByText('Ybiraete Clock');
        expect(screen.getAllByText('Ybiraete Cutting Board')).toHaveLength(1);
        await user.click(screen.getByLabelText('Selecionar Ybiraete Cutting Board'));
        expect(screen.getByLabelText('Selecionar Ybiraete Cutting Board')).toHaveProperty('checked', true);
        expect(screen.getByLabelText('Selecionar Ybiraete Clock')).toHaveProperty('checked', false);
        await user.click(screen.getByText('Ver prévia (1)'));
        api.post.mockResolvedValueOnce({ data: { simulado: true, produtos: [] } });
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/v1/admin/producers/u1/import-products', { id_manejo: 25, produto_ids: [18], simular: true }));
    });
});
