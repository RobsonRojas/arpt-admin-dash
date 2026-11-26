// Painel de produtores (add-dropshipping-producer-management-panel): textos de erro e montagem do corpo do cadastro.
// Funções puras; o servidor continua sendo a fonte da verdade das validações.
import { NEW_PRODUCT_LANGUAGES, buildProductTextAndShipping } from './productForm';
import { OFFER_DEFAULTS, buildOfferPayload } from './offer';

const MENSAGENS = {
    PRODUCER_NOT_FOUND: 'Produtor não encontrado.',
    EMAIL_IN_USE: 'Este e-mail já pertence a outro usuário.',
    ALREADY_IMPORTED: 'Este produto já foi importado para este produtor.',
    PRODUCT_NOT_IN_PROJECT: 'O produto não é recompensa deste projeto.',
    PRODUCT_NOT_IMPORTABLE: 'Produto de teste da jornada ou arquivado não pode ser importado.',
    KEYCLOAK_UNAVAILABLE: 'O serviço de autenticação está indisponível. Tente novamente em instantes.',
    FIELD_NOT_ALLOWED: 'O formulário enviou um campo que não é aceito no cadastro.',
    OFFER_INVALID: 'Os dados de oferta (estoque e prazos) estão incoerentes.',
};

/** Mensagem em português para um erro da API; cai no texto do servidor e, por fim, num texto genérico. */
export function mensagemDeErro(err, padrao = 'Não foi possível concluir a operação.') {
    const d = err?.response?.data;
    if (d?.code && MENSAGENS[d.code]) return MENSAGENS[d.code];
    if (Array.isArray(d?.detalhes) && d.detalhes.length) return d.detalhes.map((x) => `${x.campo}: ${x.mensagem}`).join('; ');
    return d?.error || padrao;
}

export const nomeCompleto = (p) => p?.nome || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || p?.email || '';

export const FORM_PRODUTO_INICIAL = {
    nome: '', info: '', preco: '', ...OFFER_DEFAULTS, weight_grams: '', width_cm: '', height_cm: '', length_cm: '', cep_origem: '', foto_url: '',
};

/** Corpo de `POST /api/v1/admin/producers/:id/products`. Devolve `{ payload }` ou `{ error }`. Nunca inclui campos reservados. */
export function montarCorpoDoProduto(form) {
    const texto = buildProductTextAndShipping(form, { ...NEW_PRODUCT_LANGUAGES, en: false });
    if (texto.error) return { error: texto.error };
    if (!String(form.info ?? '').trim()) return { error: 'Informe a descrição do produto.' };
    const preco = Number(form.preco);
    if (!(preco > 0)) return { error: 'Informe um preço maior que zero.' };
    const oferta = buildOfferPayload(form);
    if (oferta.error) return { error: oferta.error };
    const fotos = form.foto_url ? [{ src: form.foto_url, alt: String(form.nome || 'produto').padEnd(10, '_'), type: 'principal' }] : [];
    return { payload: { ...texto.payload, preco, ...oferta.payload, fotos } };
}
