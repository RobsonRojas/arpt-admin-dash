// Formulário de produto do painel: o que carregar da API e o que enviar. Funções puras; o servidor valida de novo e decide.
//
// Regra central: `nome`/`info` que a API devolve vêm TRADUZIDOS conforme o idioma do navegador (a vitrine e o app dependem disso).
// Quem edita precisa do texto GRAVADO em cada idioma, que o administrador recebe em `nome_pt`, `info_pt`, `nome_en` e `info_en`.
// Usar `nome`/`info` para editar gravaria o inglês no campo em português.
import { buildShippingPayload } from './shipping.js';

/** O servidor exige pelo menos 10 caracteres em `nome`, também na atualização. */
export const MIN_NAME_LENGTH = 10;

/** Rascunhos antigos (`product_draft_<id>`) ficam sem uso, sem limpeza manual: podem conter o inglês no campo em português. */
export function draftKey(productId) {
    return productId == null ? 'product_draft_v2_new' : `product_draft_v2_${productId}`;
}

const has = (obj, key) => obj != null && Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Quais idiomas a API trouxe. `nome_pt`/`info_pt` ausentes = API antiga ou resposta em cache: NÃO se usa `nome`/`info` no lugar.
 * `null` em `nome_en` é um valor válido (produto sem inglês) e conta como carregado.
 */
export function loadedLanguages(product) {
    return {
        pt: has(product, 'nome_pt') && has(product, 'info_pt'),
        en: has(product, 'nome_en') && has(product, 'info_en'),
    };
}

/** Texto para mostrar ao administrador quando faltam campos de idioma; `null` se está tudo carregado. */
export function languageWarning(loaded) {
    if (loaded.pt && loaded.en) return null;
    if (!loaded.pt && !loaded.en) {
        return 'A API não devolveu os textos de cada idioma (nome_pt, info_pt, nome_en, info_en). Os nomes e descrições ficam bloqueados para não gravar o idioma errado; atualize o servidor ou recarregue a página.';
    }
    return `A API não devolveu os textos em ${loaded.pt ? 'inglês' : 'português'}. Esse idioma fica bloqueado para não gravar o texto errado.`;
}

/**
 * Valores do formulário para um produto existente, só com os campos explícitos de idioma.
 * Idioma não carregado fica vazio e bloqueado (`loaded`), nunca preenchido com `nome`/`info`.
 */
export function formFromProduct(product, extra = {}) {
    const loaded = loadedLanguages(product);
    return {
        ...extra,
        nome: loaded.pt ? (product.nome_pt ?? '') : '',
        info: loaded.pt ? (product.info_pt ?? '') : '',
        nome_en: loaded.en ? (product.nome_en ?? '') : '',
        info_en: loaded.en ? (product.info_en ?? '') : '',
        weight_grams: product.weight_grams || 0,
        width_cm: product.width_cm || 0,
        height_cm: product.height_cm || 0,
        length_cm: product.length_cm || 0,
        cep_origem: product.cep_origem || '',
        loaded,
    };
}

/** Produto novo: nada a preservar, os dois idiomas estão disponíveis. */
export const NEW_PRODUCT_LANGUAGES = { pt: true, en: true };

/**
 * Textos do payload, por idioma e só do que foi carregado. Devolve `{ error }` se o nome em português é curto demais
 * (a mensagem cita o campo em português, não o texto traduzido que o usuário não está vendo).
 * Inglês vazio é enviado como vazio: apagar o inglês é uma decisão do administrador, mas só se o idioma foi carregado.
 */
export function buildTextPayload(form, loaded) {
    const payload = {};
    if (loaded.pt) {
        if (typeof form.nome !== 'string' || form.nome.trim().length < MIN_NAME_LENGTH) {
            return { error: `O nome do produto em português deve ter pelo menos ${MIN_NAME_LENGTH} caracteres.` };
        }
        payload.nome = form.nome;
        payload.info = form.info ?? '';
    }
    if (loaded.en) {
        payload.nome_en = form.nome_en ?? '';
        payload.info_en = form.info_en ?? '';
    }
    return { payload };
}

/** Texto + frete num só retorno; o primeiro erro vence e nenhum payload é devolvido junto. */
export function buildProductTextAndShipping(form, loaded) {
    const text = buildTextPayload(form, loaded);
    if (text.error) return { error: text.error };
    const shipping = buildShippingPayload(form);
    if (shipping.error) return { error: shipping.error };
    return { payload: { ...text.payload, ...shipping.payload } };
}
