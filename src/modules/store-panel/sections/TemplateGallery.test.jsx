import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../../services/api';
import { PanelProvider } from '../PanelContext';
import { translate } from '../i18n';

vi.mock('../../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
const idioma = vi.hoisted(() => ({ lang: 'pt' }));
vi.mock('../LangContext', () => ({
    useLang: () => ({ lang: idioma.lang, t: (k, p) => translate(idioma.lang, k, p), err: () => 'erro' }),
}));
import TemplateGallery, { TemplatePreview } from './TemplateGallery';

/**
 * add-dropshipper-store-template-library, 4.1 a 4.3a: galeria com filtro, pré-visualização sem API de loja, aplicar com escopo e idiomas
 * (com confirmação), desfazer, trocar paleta e estilo, e textos no idioma do painel.
 */
const T = (pt, en) => ({ pt, en });
const CATALOGO = {
    categorias: [{ id: 'premium', nome: T('Premium', 'Premium') }, { id: 'presentes', nome: T('Presentes e brindes', 'Gifts and corporate gifts') }],
    layouts: [{ id: 'classico', nome: T('Clássico', 'Classic') }],
    paletas: [{ id: 'floresta', nome: T('Floresta', 'Forest'), cores: { primaria: '#2E7D32', secundaria: '#1B5E20', fundo: '#FFFFFF', texto: '#212121' } }],
    estilos: [{ id: 'moderno', nome: T('Moderno', 'Modern') }, { id: 'classico', nome: T('Clássico', 'Classic') }],
    templates: [
        { id: 'galeria', categoria: 'premium', nome: T('Galeria', 'Gallery'), descricao: T('Poucos produtos.', 'Few products.'), layout: 'classico', paleta: 'floresta', estilo: 'classico' },
        { id: 'mimos', categoria: 'presentes', nome: T('Mimos', 'Little treats'), descricao: T('Dicas de presente.', 'Gift tips.'), layout: 'classico', paleta: 'floresta', estilo: 'moderno' },
    ],
};
const COMPOSTO = {
    tema: { cores: CATALOGO.paletas[0].cores, fonte: 'serifada', estilo_botoes: 'quadrado' },
    blocos: [{ id: 'hero', tipo: 'hero', titulo: 'Uma seleção especial', botao_texto: 'Ver produtos', exemplo: true }, { id: 'destaques', tipo: 'produtos_destaque', titulo: 'Seleção', exemplo: true }],
};
const reload = vi.fn(async () => undefined);
const notify = vi.fn();

const abrir = (rascunho = { idiomas: ['pt'] }) => render(
    <PanelProvider value={{ store: { id: 9 }, config: { rascunho }, reload, notify }}><TemplateGallery /></PanelProvider>,
);

beforeEach(() => {
    vi.clearAllMocks(); idioma.lang = 'pt';
    api.get.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/compose') ? { config: COMPOSTO } : CATALOGO }));
    api.post.mockResolvedValue({ data: {} }); api.put.mockResolvedValue({ data: {} });
});
afterEach(cleanup);

describe('galeria', () => {
    it('lista os templates no idioma do painel e filtra por categoria, sem gravar nada', async () => {
        abrir();
        expect(await screen.findByTestId('tpl-galeria')).toHaveTextContent('Galeria');
        expect(screen.getByTestId('tpl-mimos')).toBeInTheDocument();
        await userEvent.click(within(screen.getByTestId('gallery-category')).getByRole('combobox'));
        await userEvent.click(await screen.findByRole('option', { name: 'Presentes e brindes' }));
        await waitFor(() => expect(screen.queryByTestId('tpl-galeria')).not.toBeInTheDocument());
        expect(screen.getByTestId('tpl-mimos')).toBeInTheDocument();
        expect(api.post).not.toHaveBeenCalled(); expect(api.put).not.toHaveBeenCalled();
    });

    it('em inglês, nomes e descrições vêm em inglês', async () => {
        idioma.lang = 'en';
        abrir();
        expect(await screen.findByTestId('tpl-mimos')).toHaveTextContent('Little treats');
        expect(screen.getByTestId('tpl-mimos')).toHaveTextContent('Gift tips.');
    });

    it('pré-visualizar compõe pela biblioteca (nada da loja) e mostra produtos de exemplo e a marca de exemplo', async () => {
        abrir();
        await userEvent.click(within(await screen.findByTestId('tpl-galeria')).getByRole('button', { name: 'Pré-visualizar' }));
        const previa = await screen.findByTestId('template-preview');
        expect(previa).toHaveTextContent('Uma seleção especial');
        expect(previa).toHaveTextContent('Produto de exemplo 1');
        expect(within(previa).getAllByText('Texto de exemplo').length).toBeGreaterThan(0);
        expect(api.get).toHaveBeenCalledWith('/api/v1/dropshipping/storefront/templates/compose', { params: { template: 'galeria', idiomas: 'pt' } });
        expect(api.get.mock.calls.every(([u]) => !u.includes('/stores/'))).toBe(true);
        expect(api.post).not.toHaveBeenCalled();
    });

    it('aplicar pede confirmação; cancelar não grava; confirmar manda escopo e idiomas e permite desfazer', async () => {
        abrir({ idiomas: ['pt'] });
        await userEvent.click(within(await screen.findByTestId('tpl-galeria')).getByRole('button', { name: 'Escolher' }));
        await userEvent.click(screen.getByTestId('scope-blocos'));
        await userEvent.click(screen.getByTestId('lang-en'));
        await userEvent.click(screen.getByTestId('apply-template'));
        await userEvent.click(screen.getByTestId('cancel-apply'));
        expect(api.post).not.toHaveBeenCalled();
        await userEvent.click(screen.getByTestId('apply-template'));
        await userEvent.click(screen.getByTestId('confirm-apply'));
        expect(api.post).toHaveBeenCalledWith('/api/v1/dropshipping/stores/9/storefront/template', { template: 'galeria', escopo: 'blocos', idiomas: ['pt', 'en'] });
        expect(reload).toHaveBeenCalled();
        await userEvent.click(await screen.findByTestId('undo-template'));
        expect(api.post).toHaveBeenLastCalledWith('/api/v1/dropshipping/stores/9/storefront/template/undo');
    });

    it('sem template escolhido ou sem idioma, aplicar fica desabilitado', async () => {
        abrir({ idiomas: ['pt'] });
        expect(await screen.findByTestId('apply-template')).toBeDisabled();
        await userEvent.click(within(screen.getByTestId('tpl-galeria')).getByRole('button', { name: 'Escolher' }));
        expect(screen.getByTestId('apply-template')).toBeEnabled();
        await userEvent.click(screen.getByTestId('lang-pt'));
        expect(screen.getByTestId('apply-template')).toBeDisabled();
    });

    it('combinação livre manda layout, paleta e estilo', async () => {
        abrir();
        await userEvent.click(await screen.findByTestId('gallery-free'));
        for (const [k, nome] of [['layout', 'Clássico'], ['paleta', 'Floresta'], ['estilo', 'Moderno']]) {
            await userEvent.click(within(screen.getByTestId(`free-${k}`)).getByRole('combobox'));
            await userEvent.click(await screen.findByRole('option', { name: nome }));
        }
        await userEvent.click(screen.getByTestId('apply-template'));
        await userEvent.click(screen.getByTestId('confirm-apply'));
        expect(api.post).toHaveBeenCalledWith('/api/v1/dropshipping/stores/9/storefront/template', { layout: 'classico', paleta: 'floresta', estilo: 'moderno', escopo: 'tudo', idiomas: ['pt'] });
    });

    it('trocar só a paleta usa a rota própria, sem mexer nos blocos', async () => {
        abrir();
        await screen.findByTestId('tpl-galeria');
        await userEvent.click(within(screen.getByTestId('parts-palette')).getByRole('combobox'));
        await userEvent.click(await screen.findByRole('option', { name: 'Floresta' }));
        await userEvent.click(screen.getByTestId('apply-palette'));
        expect(api.put).toHaveBeenCalledWith('/api/v1/dropshipping/stores/9/storefront/theme-parts', { paleta: 'floresta' });
        expect(api.post).not.toHaveBeenCalled();
    });
});

describe('pré-visualização', () => {
    it('não tem imagem nem link externo', () => {
        const { container } = render(<TemplatePreview config={COMPOSTO} lang="pt" />);
        expect(container.querySelectorAll('img, a, script, iframe')).toHaveLength(0);
    });
});
