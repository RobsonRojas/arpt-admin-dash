import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../../services/api';
import { PanelProvider } from '../PanelContext';
import { translate } from '../i18n';

vi.mock('../../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
const idioma = vi.hoisted(() => ({ lang: 'pt' }));
vi.mock('../LangContext', () => ({ useLang: () => ({ lang: idioma.lang, t: (k, p) => translate(idioma.lang, k, p), err: (e) => translate(idioma.lang, `api_${e?.response?.data?.code ?? 'GENERIC'}`) }) }));
import AiAssistant from './AiAssistant';

/** add-ai-storefront-customization, 5.1 a 5.3a: pedido, idiomas, privacidade, estados, comparação, aceite por seção e descarte. */
const BASE = '/api/v1/dropshipping/stores/9/storefront';
const DISPONIVEL = { disponivel: true, restantes_hora: 4, restantes_dia: 19, esgotado: false, libera_em: null };
const conteudo = (titulo) => ({ blocos: [{ id: 'hero', tipo: 'hero', titulo }], paginas: {}, menu: [], rodape: { texto: 'Meu rodapé' }, seo: { titulo: 'Loja', descricao: 'Desc' } });
const PROPOSTA = { proposta_id: 'p'.repeat(22), idiomas: ['pt', 'en'], proposta: { tema: { cores: { primaria: '#2E7D32' }, fonte: 'serifada' }, conteudo: { pt: conteudo('Móveis rústicos'), en: conteudo('Rustic furniture') } } };
const reload = vi.fn(async () => undefined);
const notify = vi.fn();
const abrir = (rascunho = { rodape: { texto: 'Meu rodapé' }, seo: { titulo: 'Loja', descricao: 'Desc' } }) => render(
    <PanelProvider value={{ store: { id: 9 }, config: { rascunho }, reload, notify }}><AiAssistant /></PanelProvider>,
);

beforeEach(() => {
    vi.clearAllMocks(); idioma.lang = 'pt';
    api.get.mockResolvedValue({ data: DISPONIVEL });
    api.post.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/propose') ? PROPOSTA : {} }));
});
afterEach(cleanup);

describe('assistente de IA', () => {
    it('indisponível: avisa e não mostra o pedido', async () => {
        api.get.mockResolvedValue({ data: { disponivel: false } });
        abrir();
        expect(await screen.findByTestId('ai-unavailable')).toBeInTheDocument();
        expect(screen.queryByTestId('ai-request')).not.toBeInTheDocument();
    });

    it('mostra o aviso de privacidade e as propostas restantes; pedido curto ou sem idioma não envia', async () => {
        abrir();
        expect(await screen.findByTestId('ai-privacy')).toHaveTextContent('Anthropic');
        expect(screen.getByTestId('ai-remaining')).toHaveTextContent('4 nesta hora, 19 hoje');
        expect(screen.getByTestId('ai-propose')).toBeDisabled();
        await userEvent.type(screen.getByTestId('ai-request'), 'loja de móveis');
        expect(screen.getByTestId('ai-propose')).toBeEnabled();
        await userEvent.click(screen.getByTestId('ai-lang-pt'));
        expect(screen.getByTestId('ai-propose')).toBeDisabled();
    });

    it('pede com os idiomas escolhidos, compara e aceita só as seções marcadas', async () => {
        abrir();
        await userEvent.type(await screen.findByTestId('ai-request'), 'loja de móveis rústicos');
        await userEvent.click(screen.getByTestId('ai-lang-en'));
        await userEvent.click(screen.getByTestId('ai-propose'));
        expect(api.post).toHaveBeenCalledWith(`${BASE}/ai/propose`, { pedido: 'loja de móveis rústicos', idiomas: ['pt', 'en'] });
        expect(await screen.findByTestId('ai-proposal')).toBeInTheDocument();
        // Já vêm marcadas só as seções que mudam (rodapé e SEO são iguais ao rascunho).
        expect(screen.getByTestId('ai-accept-tema')).toBeChecked();
        expect(screen.getByTestId('ai-accept-blocos')).toBeChecked();
        expect(screen.getByTestId('ai-accept-rodape')).not.toBeChecked();
        expect(screen.getByTestId('template-preview')).toHaveTextContent('Móveis rústicos');
        await userEvent.click(screen.getByTestId('ai-view-en'));
        expect(screen.getByTestId('template-preview')).toHaveTextContent('Rustic furniture');
        await userEvent.click(screen.getByTestId('ai-accept-tema'));
        await userEvent.click(screen.getByTestId('ai-accept'));
        expect(api.post).toHaveBeenLastCalledWith(`${BASE}/ai/accept`, { proposta_id: PROPOSTA.proposta_id, secoes: ['blocos'] });
        expect(reload).toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByTestId('ai-proposal')).not.toBeInTheDocument());
    });

    it('descartar não chama o servidor', async () => {
        abrir();
        await userEvent.type(await screen.findByTestId('ai-request'), 'loja de móveis rústicos');
        await userEvent.click(screen.getByTestId('ai-propose'));
        await userEvent.click(await screen.findByTestId('ai-discard'));
        expect(api.post).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('ai-proposal')).not.toBeInTheDocument();
        expect(reload).not.toHaveBeenCalled();
    });

    it('limite atingido (429) mostra quando libera; outros erros, a mensagem traduzida', async () => {
        abrir();
        await userEvent.type(await screen.findByTestId('ai-request'), 'loja de móveis rústicos');
        api.post.mockRejectedValueOnce({ response: { status: 429, data: { code: 'AI_LIMIT_REACHED', libera_em: '2026-10-31T15:00:00Z' } } });
        await userEvent.click(screen.getByTestId('ai-propose'));
        expect(await screen.findByTestId('ai-error')).toHaveTextContent('Libera em');
        api.post.mockRejectedValueOnce({ response: { status: 422, data: { code: 'AI_PROPOSAL_INVALID' } } });
        await userEvent.click(screen.getByTestId('ai-propose'));
        expect(await screen.findByTestId('ai-error')).toHaveTextContent('Não foi possível gerar uma proposta válida');
    });

    it('em inglês, a tela inteira (privacidade e erros) aparece em inglês', async () => {
        idioma.lang = 'en';
        abrir();
        expect(await screen.findByTestId('ai-privacy')).toHaveTextContent('Do not write personal data');
        expect(screen.getByTestId('ai-propose')).toHaveTextContent('Get a proposal');
    });
});
