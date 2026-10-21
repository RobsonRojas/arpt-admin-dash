// Dados de frete do produto (peso, medidas e CEP de origem). Funções puras: o servidor valida de novo e decide.
// Os limites espelham os do backend (src/services/offer/shippingData.ts).

export const MAX_WEIGHT_GRAMS = 200000;
export const MAX_DIMENSION_CM = 400;

/** CEP só com os 8 dígitos; `null` se não for um CEP. */
export function normalizeCep(raw) {
    if (typeof raw !== 'string') return null;
    const digits = raw.trim().replace(/[\s.-]/g, '');
    return /^\d{8}$/.test(digits) ? digits : null;
}

const FIELDS = [
    { key: 'weight_grams', label: 'Peso (g)', max: MAX_WEIGHT_GRAMS },
    { key: 'width_cm', label: 'Largura (cm)', max: MAX_DIMENSION_CM },
    { key: 'height_cm', label: 'Altura (cm)', max: MAX_DIMENSION_CM },
    { key: 'length_cm', label: 'Profundidade (cm)', max: MAX_DIMENSION_CM },
];

/**
 * Monta os campos de frete do payload do produto. Em branco ou 0 = não informado (grava 0; sem o dado o produto não
 * é vendido com frete). Peso e medidas são inteiros de 0 até o teto. CEP vazio apaga a origem (`null`).
 * Devolve `{ payload }` ou `{ error }` com a mensagem para o campo.
 */
export function buildShippingPayload(form) {
    const payload = {};
    for (const { key, label, max } of FIELDS) {
        const raw = form?.[key];
        if (raw === '' || raw === null || raw === undefined) { payload[key] = 0; continue; }
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 0) return { error: `${label}: use um número inteiro, sem casas decimais.` };
        if (n > max) return { error: `${label}: o máximo é ${max.toLocaleString('pt-BR')}.` };
        payload[key] = n;
    }
    const cep = String(form?.cep_origem ?? '').trim();
    if (cep === '') payload.cep_origem = null;
    else {
        const ok = normalizeCep(cep);
        if (!ok) return { error: 'CEP de origem: informe 8 dígitos (ex.: 69000-000).' };
        payload.cep_origem = ok;
    }
    return { payload };
}

/** O que falta para o produto ser vendido com frete (mesma regra do servidor; origem pode vir do padrão do ambiente). */
export function missingShippingLabels(product, hasEnvFallback = false) {
    const out = [];
    for (const { key, label } of FIELDS) if (!(Number(product?.[key]) > 0)) out.push(label);
    if (!normalizeCep(String(product?.cep_origem ?? '')) && !hasEnvFallback) out.push('CEP de origem');
    return out;
}
