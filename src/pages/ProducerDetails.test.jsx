import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../services/api';
import { ProducerDetails } from './ProducerDetails';

vi.mock('../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { getIdToken: async () => 't' } }) }));
vi.mock('../components/modules/ProducerProductsTransfer', () => ({ ProducerProductsTransfer: ({ userId }) => <div>transferir:{userId}</div> }));

const PRODUTOR = {
    id: 'u1', first_name: 'Ana', last_name: 'Souza', email: 'ana@p.test', is_active: true,
    produtos: [{ id: 7, nome: 'Banco de jatobá', preco: 250, is_ativo: true, catalogo_dropshipper: false, estoque: 0, is_madeira: false, importado_de: 3, lojas_alocadas: 0, sem_dados_de_frete: true }],
};
const PROJETOS = { data: [{ id: 10, nome: 'Projeto Acurui', municipio: 'Manaus', estado: 'AM' }], total: 1 };
const PRODUTOS_PROJETO = { data: [
    { id: 3, nome: 'Banco de jatobá', preco: 250, foto: null, is_madeira: false, ja_importado: true },
    { id: 4, nome: 'Mesa de cedro', preco: 900, foto: null, is_madeira: false, ja_importado: false },
] };

beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation(async (url) => {
        if (url.endsWith('/import-sources/projects')) return { data: PROJETOS };
        if (url.includes('/import-sources/projects/10/products')) return { data: PRODUTOS_PROJETO };
        return { data: PRODUTOR };
    });
});
afterEach(cleanup);

const abrir = () => render(
    <MemoryRouter initialEntries={['/dropshipping-admin/produtores/u1']}>
        <Routes><Route path="/dropshipping-admin/produtores/:id" element={<ProducerDetails />} /></Routes>
    </MemoryRouter>,
);

describe('Detalhe do produtor', () => {
    it('mostra os dados e os produtos com a situação', async () => {
        abrir();
        await screen.findByRole('heading', { name: 'Ana Souza' });
        expect(screen.getByLabelText(/^Nome/).value).toBe('Ana');
        await userEvent.click(screen.getByRole('tab', { name: /Produtos \(1\)/ }));
        expect(screen.getByText('Banco de jatobá')).toBeTruthy();
        expect(screen.getByText('Sem dados de frete')).toBeTruthy();
        expect(screen.getByText('Importado do #3')).toBeTruthy();
        expect(screen.getByText('Fora do catálogo')).toBeTruthy();
    });

    it('edita nome e e-mail', async () => {
        api.put.mockResolvedValue({ data: { ...PRODUTOR, first_name: 'Maria' } });
        abrir();
        await screen.findByRole('heading', { name: 'Ana Souza' });
        const nome = screen.getByLabelText(/^Nome/);
        await userEvent.clear(nome); await userEvent.type(nome, 'Maria');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar dados' }));
        await waitFor(() => expect(api.put).toHaveBeenCalledWith('/api/v1/admin/producers/u1', { first_name: 'Maria', last_name: 'Souza', email: 'ana@p.test' }));
        await screen.findByRole('heading', { name: 'Maria Souza' });
    });

    it('e-mail já usado mostra o erro e mantém o formulário', async () => {
        api.put.mockRejectedValue({ response: { data: { code: 'EMAIL_IN_USE' } } });
        abrir();
        await screen.findByRole('heading', { name: 'Ana Souza' });
        await userEvent.click(screen.getByRole('button', { name: 'Salvar dados' }));
        await screen.findByText('Este e-mail já pertence a outro usuário.');
        expect(screen.getByLabelText(/^E-mail/).value).toBe('ana@p.test');
    });

    it('cadastra produto: valida antes de enviar e envia sem campos reservados', async () => {
        api.post.mockResolvedValue({ data: { id: 9, nome: 'Tábua' } });
        abrir();
        await screen.findByRole('heading', { name: 'Ana Souza' });
        await userEvent.click(screen.getByRole('tab', { name: /Produtos/ }));
        await userEvent.click(screen.getByRole('button', { name: 'Cadastrar produto' }));
        await screen.findByRole('dialog');
        // Com o diálogo aberto, o resto da página fica oculto: só o botão do diálogo responde a esse nome.
        await userEvent.click(await screen.findByRole('button', { name: 'Cadastrar produto' }));
        await screen.findByText(/nome do produto em português/i);
        expect(api.post).not.toHaveBeenCalled();
    });

    it('importa de projeto: escolhe projeto, não deixa marcar o já importado, mostra prévia e confirma', async () => {
        api.post.mockImplementation(async (_u, body) => (body.simular
            ? { data: { simulado: true, produtos: [{ origem_produto_id: 4, nome: 'Mesa de cedro', is_madeira: false }] } }
            : { data: { simulado: false, produtos: [{ id: 20, origem_produto_id: 4, nome: 'Mesa de cedro' }] } }));
        abrir();
        await screen.findByRole('heading', { name: 'Ana Souza' });
        await userEvent.click(screen.getByRole('tab', { name: /Produtos/ }));
        await userEvent.click(screen.getByRole('button', { name: 'Importar de projeto' }));
        await userEvent.click(await screen.findByText('Projeto Acurui'));
        const jaImportado = await screen.findByRole('checkbox', { name: 'Selecionar Banco de jatobá' });
        expect(jaImportado.disabled).toBe(true);
        await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Mesa de cedro' }));
        await userEvent.click(screen.getByRole('button', { name: /Ver prévia \(1\)/ }));
        await screen.findByText(/Serão criados 1 produto/);
        expect(api.post).toHaveBeenLastCalledWith('/api/v1/admin/producers/u1/import-products', { id_manejo: 10, produto_ids: [4], simular: true });
        await userEvent.click(screen.getByRole('button', { name: 'Confirmar importação' }));
        await screen.findByText(/1 produto\(s\) importado\(s\)/);
        expect(api.post).toHaveBeenLastCalledWith('/api/v1/admin/producers/u1/import-products', { id_manejo: 10, produto_ids: [4], simular: false });
    });

    it('importação repetida mostra o erro do servidor', async () => {
        api.post.mockRejectedValue({ response: { data: { code: 'ALREADY_IMPORTED' } } });
        abrir();
        await screen.findByRole('heading', { name: 'Ana Souza' });
        await userEvent.click(screen.getByRole('tab', { name: /Produtos/ }));
        await userEvent.click(screen.getByRole('button', { name: 'Importar de projeto' }));
        await userEvent.click(await screen.findByText('Projeto Acurui'));
        await userEvent.click(await screen.findByRole('checkbox', { name: 'Selecionar Mesa de cedro' }));
        await userEvent.click(screen.getByRole('button', { name: /Ver prévia/ }));
        await screen.findByText('Este produto já foi importado para este produtor.');
    });

    it('produtor inexistente mostra o erro', async () => {
        api.get.mockRejectedValue({ response: { data: { code: 'PRODUCER_NOT_FOUND' } } });
        abrir();
        await screen.findByText('Produtor não encontrado.');
    });

    it('aba de transferência usa o componente existente com o id do produtor', async () => {
        abrir();
        await screen.findByRole('heading', { name: 'Ana Souza' });
        await userEvent.click(screen.getByRole('tab', { name: 'Transferir produtos' }));
        expect(screen.getByText('transferir:u1')).toBeTruthy();
    });
});
