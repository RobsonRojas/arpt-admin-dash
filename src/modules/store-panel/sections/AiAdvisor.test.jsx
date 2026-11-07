import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../../services/api';
import { PanelProvider } from '../PanelContext';
import { translate } from '../i18n';

vi.mock('../../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
const idioma = vi.hoisted(() => ({ lang: 'pt' }));
vi.mock('../LangContext', () => ({ useLang: () => ({ lang: idioma.lang, t: (k, p) => translate(idioma.lang, k, p), err: (e) => translate(idioma.lang, `api_${e?.response?.data?.code ?? 'GENERIC'}`) }) }));
import AiAdvisor from './AiAdvisor';

/** add-llm-store-advisor, 5.1 a 5.3: sinais, aviso de privacidade, análise, aplicar com aceite, copiar, dispensar e restaurar. */
const BASE = '/api/v1/dropshipping/stores/9/storefront/ai';
const SINAIS = { produtos_total: 5, produtos_sem_descricao: 2, produtos_sem_foto: 1, produtos_sem_ingles: 3, idiomas: ['pt'], seo_titulo: false, seo_descricao: false, blocos: 0, menu: 0, rodape: true };
const SEO = { chave: 'loja-loja-seo_vazio', sinal: 'seo_vazio', area: 'loja', produto_id: null, severidade: 'alta', titulo: 'Preencha o SEO', justificativa: 'Sem título nas buscas.', acao: 'aplicar_aparencia', secao: 'seo', texto_sugerido: '' };
const PROD = { chave: 'produto-7-sem_descricao', sinal: 'sem_descricao', area: 'produto', produto_id: 7, severidade: 'media', titulo: 'Descrição curta', justificativa: 'Poucas palavras.', acao: 'texto_produto', secao: null, texto_sugerido: 'Mesa de madeira maciça.' };
const ESTADO = { disponivel: true, restantes_dia: 2, esgotado: false, libera_em: null, sinais: SINAIS, dispensadas: [], analise: { gerado_em: '2026-11-02T12:00:00Z', idioma: 'pt', sugestoes: [SEO, PROD] } };
const PROPOSTA = { proposta_id: 'p'.repeat(22), secao_sugerida: 'seo', idiomas: ['pt'], proposta: { tema: {}, conteudo: { pt: { blocos: [], paginas: [], menu: [], rodape: { texto: '' }, seo: { titulo: 'Móveis rústicos', descricao: 'Loja de móveis.' } } } } };
const reload = vi.fn(async () => undefined);
const notify = vi.fn();
const abrir = () => render(<PanelProvider value={{ store: { id: 9 }, config: { rascunho: {} }, reload, notify }}><AiAdvisor /></PanelProvider>);

beforeEach(() => {
  vi.clearAllMocks(); idioma.lang = 'pt';
  api.get.mockResolvedValue({ data: ESTADO });
  api.post.mockImplementation((url) => Promise.resolve({ data: url.endsWith('/advice/apply') ? PROPOSTA : url.endsWith('/advise') ? ESTADO : {} }));
  api.delete.mockResolvedValue({ data: {} });
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});
afterEach(cleanup);

describe('consultor de IA', () => {
  it('mostra os sinais e as sugestões, com privacidade e cota', async () => {
    abrir();
    expect(await screen.findByTestId('adv-signals')).toHaveTextContent('Sem descrição boa');
    expect(screen.getByTestId('adv-privacy')).toHaveTextContent('Anthropic');
    expect(screen.getByTestId('adv-remaining')).toHaveTextContent('2');
    expect(screen.getByTestId(`adv-item-${SEO.chave}`)).toHaveTextContent('Preencha o SEO');
    expect(screen.getByTestId(`adv-item-${PROD.chave}`)).toHaveTextContent('Produto #7');
    expect(screen.getByTestId(`adv-text-${PROD.chave}`)).toHaveTextContent('Mesa de madeira maciça.');
  });

  it('indisponível: mostra os sinais, avisa e não oferece analisar', async () => {
    api.get.mockResolvedValue({ data: { ...ESTADO, disponivel: false, analise: null } });
    abrir();
    expect(await screen.findByTestId('adv-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('adv-signals')).toBeInTheDocument();
    expect(screen.queryByTestId('adv-analyze')).not.toBeInTheDocument();
  });

  it('analisa no idioma do painel; em inglês a tela e o pedido vão em inglês', async () => {
    idioma.lang = 'en';
    abrir();
    await userEvent.click(await screen.findByTestId('adv-analyze'));
    expect(api.post).toHaveBeenCalledWith(`${BASE}/advise`, { idioma: 'en' });
    expect(screen.getByTestId('adv-privacy')).toHaveTextContent('No customer or order data');
  });

  it('limite esgotado desliga o botão e mostra quando libera', async () => {
    api.get.mockResolvedValue({ data: { ...ESTADO, esgotado: true, restantes_dia: 0, libera_em: '2026-11-03T12:00:00Z' } });
    abrir();
    expect(await screen.findByTestId('adv-limit')).toBeInTheDocument();
    expect(screen.getByTestId('adv-analyze')).toBeDisabled();
  });

  it('aplicar gera proposta e só grava no aceite, só da seção sugerida', async () => {
    abrir();
    await userEvent.click(await screen.findByTestId(`adv-apply-${SEO.chave}`));
    expect(api.post).toHaveBeenCalledWith(`${BASE}/advice/apply`, { chave: SEO.chave, idiomas: ['pt'] });
    expect(await screen.findByTestId('adv-proposal-summary')).toHaveTextContent('Móveis rústicos');
    expect(api.post).not.toHaveBeenCalledWith(`${BASE}/accept`, expect.anything());
    await userEvent.click(screen.getByTestId('adv-accept'));
    expect(api.post).toHaveBeenLastCalledWith(`${BASE}/accept`, { proposta_id: PROPOSTA.proposta_id, secoes: ['seo'] });
    expect(reload).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByTestId('adv-proposal')).not.toBeInTheDocument());
  });

  it('descartar a proposta não chama o servidor de novo', async () => {
    abrir();
    await userEvent.click(await screen.findByTestId(`adv-apply-${SEO.chave}`));
    await userEvent.click(await screen.findByTestId('adv-discard'));
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });

  it('sugestão de produto só copia o texto: não há botão de aplicar', async () => {
    abrir();
    await screen.findByTestId(`adv-item-${PROD.chave}`);
    expect(screen.queryByTestId(`adv-apply-${PROD.chave}`)).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId(`adv-copy-${PROD.chave}`));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Mesa de madeira maciça.');
  });

  it('dispensa e restaura', async () => {
    abrir();
    await userEvent.click(await screen.findByTestId(`adv-dismiss-${PROD.chave}`));
    expect(api.post).toHaveBeenCalledWith(`${BASE}/advice/dismiss`, { chave: PROD.chave });
    api.get.mockResolvedValue({ data: { ...ESTADO, dispensadas: [PROD.chave], analise: { ...ESTADO.analise, sugestoes: [SEO] } } });
    await userEvent.click(await screen.findByTestId(`adv-dismiss-${SEO.chave}`));
    await userEvent.click(await screen.findByTestId(`adv-restore-${PROD.chave}`));
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/advice/dismiss/${PROD.chave}`);
  });

  it('erro 429 na análise mostra o horário de liberação', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 429, data: { code: 'AI_LIMIT_REACHED', libera_em: '2026-11-03T12:00:00Z' } } });
    abrir();
    await userEvent.click(await screen.findByTestId('adv-analyze'));
    expect(await screen.findByTestId('adv-error')).toHaveTextContent('Limite de análises atingido');
  });
});
