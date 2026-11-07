// Modo de oferta e prazos do produto (ver backend/manejo-api/docs/OFERTA_E_PRAZOS.md).
// Funções puras: o servidor é quem calcula o prazo mostrado ao cliente; aqui só se monta o formulário e o texto.

export const MODOS = {
    PRONTA_ENTREGA: 'Pronta entrega',
    ENCOMENDA: 'Encomenda',
};

export const OFFER_DEFAULTS = {
    modo_oferta: 'ENCOMENDA',
    estoque: '',
    prazo_despacho_dias: '',
    prazo_producao_dias_min: '',
    prazo_producao_dias_max: '',
    capacidade_semanal: '',
    limite_fila: '',
};

const OFFER_FIELDS = Object.keys(OFFER_DEFAULTS);
const blank = (v) => v === '' || v === null || v === undefined;

/** Valores do formulário a partir do produto (campos vazios viram texto vazio para o input). */
export function offerFormFromProduct(product) {
    const form = { ...OFFER_DEFAULTS };
    if (!product) return form;
    for (const f of OFFER_FIELDS) if (!blank(product[f])) form[f] = product[f];
    if (blank(product.modo_oferta)) form.modo_oferta = 'ENCOMENDA';
    return form;
}

/**
 * Monta os campos de oferta do payload e valida a coerência por modo, como o servidor.
 * Devolve `{ payload }` ou `{ error }`. Campos vazios opcionais são omitidos (o servidor não aceita null).
 */
export function buildOfferPayload(form) {
    const modo = form.modo_oferta || 'ENCOMENDA';
    const num = (v) => Number(v);
    const bad = (v) => !Number.isInteger(num(v)) || num(v) < 0;
    const payload = { modo_oferta: modo };

    if (modo === 'PRONTA_ENTREGA') {
        if (blank(form.estoque) || bad(form.estoque)) return { error: 'Informe o estoque (número inteiro, 0 ou mais).' };
        if (blank(form.prazo_despacho_dias) || bad(form.prazo_despacho_dias)) return { error: 'Informe o prazo de despacho em dias.' };
        payload.estoque = num(form.estoque);
        payload.prazo_despacho_dias = num(form.prazo_despacho_dias);
    } else {
        if (blank(form.prazo_producao_dias_min) || blank(form.prazo_producao_dias_max) || bad(form.prazo_producao_dias_min) || bad(form.prazo_producao_dias_max)) {
            return { error: 'Informe o prazo de produção mínimo e máximo, em dias.' };
        }
        if (num(form.prazo_producao_dias_min) > num(form.prazo_producao_dias_max)) {
            return { error: 'O prazo de produção mínimo não pode ser maior que o máximo.' };
        }
        payload.prazo_producao_dias_min = num(form.prazo_producao_dias_min);
        payload.prazo_producao_dias_max = num(form.prazo_producao_dias_max);
        if (!blank(form.prazo_despacho_dias)) {
            if (bad(form.prazo_despacho_dias)) return { error: 'Prazo de despacho inválido.' };
            payload.prazo_despacho_dias = num(form.prazo_despacho_dias);
        }
        if (!blank(form.limite_fila)) {
            if (bad(form.limite_fila)) return { error: 'Limite de fila inválido.' };
            payload.limite_fila = num(form.limite_fila);
        }
    }
    if (!blank(form.capacidade_semanal)) {
        if (bad(form.capacidade_semanal)) return { error: 'Capacidade semanal inválida.' };
        payload.capacidade_semanal = num(form.capacidade_semanal);
    }
    return { payload };
}

/** "27 a 40 dias", "7 dias" ou "—" (sem prazo). Aceita `{min,max}` (prazo_estimado_dias) ou o produto cru. */
export function leadTimeLabel(source) {
    if (!source) return '—';
    let range = source.prazo_estimado_dias;
    if (!range && (source.modo_oferta || source.prazo_despacho_dias !== undefined)) {
        const des = Number(source.prazo_despacho_dias ?? 0);
        const prod = source.modo_oferta === 'PRONTA_ENTREGA' ? { min: 0, max: 0 }
            : { min: Number(source.prazo_producao_dias_min ?? 0), max: Number(source.prazo_producao_dias_max ?? 0) };
        range = { min: prod.min + des, max: prod.max + des };
    }
    if (!range) return '—';
    if (range.min === 0 && range.max === 0) return '—';
    return range.min === range.max ? `${range.max} dias` : `${range.min} a ${range.max} dias`;
}

export const modoLabel = (modo) => MODOS[modo] ?? MODOS.ENCOMENDA;
