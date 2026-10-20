// Pedidos, repasses e SLA no painel (ver backend/manejo-api/docs/PEDIDOS_E_REPASSES.md).
// Funções puras: o servidor decide estados, valores e permissões; aqui só se formata e se decide o que mostrar.

export const STATUS_LABEL = {
    PAGO: 'Aguardando aceite',
    ACEITO: 'Aceito',
    EM_PRODUCAO: 'Em produção',
    PRONTO: 'Pronto',
    ENVIADO: 'Enviado',
    ENTREGUE: 'Entregue',
    CANCELADO: 'Cancelado',
    DEVOLVIDO: 'Devolvido',
};

export const STATUS_COLOR = {
    PAGO: 'warning', ACEITO: 'info', EM_PRODUCAO: 'info', PRONTO: 'primary', ENVIADO: 'primary',
    ENTREGUE: 'success', CANCELADO: 'default', DEVOLVIDO: 'error',
};

export const statusLabel = (s) => STATUS_LABEL[s] ?? s ?? '—';
export const statusColor = (s) => STATUS_COLOR[s] ?? 'default';

export const PAYOUT_STATUS_LABEL = { PENDENTE: 'Pendente', RETIDO: 'Retido', LIBERADO: 'Liberado', CANCELADO: 'Cancelado' };
export const payoutStatusLabel = (s) => PAYOUT_STATUS_LABEL[s] ?? s ?? '—';

export const HOLD_REASON_LABEL = {
    SEM_CONTA: 'Sem conta de recebimento',
    CONTA_NAO_ATIVA: 'Conta de recebimento ainda não ativa',
};
export const holdReasonLabel = (m) => (m ? HOLD_REASON_LABEL[m] ?? m : '');

export const BENEFICIARY_LABEL = { PRODUTOR: 'Produtor', DROPSHIPPER: 'Dropshipper', ARPT: 'ARPT' };
export const beneficiaryLabel = (t) => BENEFICIARY_LABEL[t] ?? t ?? '—';

/** R$ 1.234,56; vazio ou inválido vira "—" (nunca "R$ NaN"). */
export function money(value) {
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
}

export function dateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
}

/** Quanto falta (ou passou) de um prazo: "2 d 3 h", "atrasado há 1 d 4 h" ou "—". */
export function deadlineText(iso, now = Date.now()) {
    if (!iso) return '—';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '—';
    const minutes = Math.floor(Math.abs(t - now) / 60000);
    const d = Math.floor(minutes / 1440);
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    const span = d > 0 ? `${d} d ${h} h` : `${h} h ${m} min`;
    return t < now ? `atrasado há ${span}` : span;
}

/** Soma das margens dos pedidos não cancelados (o que a loja espera receber), em centavos exatos. */
export function totalMargin(orders) {
    const cents = (orders ?? [])
        .filter((o) => !['CANCELADO', 'DEVOLVIDO'].includes(o.status))
        .reduce((s, o) => s + Math.round(Number(o.margem ?? 0) * 100), 0);
    return cents / 100;
}

/** Contagem por estado, na ordem do fluxo, só com os que têm pedidos. */
export function countByStatus(orders) {
    const order = Object.keys(STATUS_LABEL);
    const counts = {};
    for (const o of orders ?? []) counts[o.status] = (counts[o.status] ?? 0) + 1;
    return order.filter((s) => counts[s]).map((s) => ({ status: s, label: STATUS_LABEL[s], count: counts[s] }));
}

/** A loja pode pedir o cancelamento? Antes do envio; depois do aceite o administrador decide. */
export function cancelHint(status) {
    if (status === 'PAGO') return { allowed: true, direct: true, text: 'Cancela na hora e reembolsa o cliente.' };
    if (['ACEITO', 'EM_PRODUCAO', 'PRONTO'].includes(status)) return { allowed: true, direct: false, text: 'Gera uma solicitação que o administrador decide.' };
    return { allowed: false, direct: false, text: '' };
}

/** Resumo do resultado de um pedido de cancelamento devolvido pela API. */
export function cancelResultMessage(result) {
    if (result?.resultado === 'CANCELADO') return 'Pedido cancelado. O reembolso foi solicitado.';
    if (result?.resultado === 'SOLICITADO') return 'Solicitação enviada ao administrador.';
    return 'Não foi possível cancelar.';
}

/** SLA: percentual ou "indisponível" quando não há histórico (nunca 0%). */
export function slaRate(window) {
    return window && window.taxa_no_prazo !== null && window.taxa_no_prazo !== undefined && window.total > 0
        ? `${Number(window.taxa_no_prazo).toFixed(1).replace('.', ',')}%`
        : 'indisponível';
}

export function slaDelay(window) {
    return window?.atraso_medio_dias != null ? `${String(window.atraso_medio_dias).replace('.', ',')} dias` : '—';
}

/** Mensagem de erro da API (campo `error`) ou um texto padrão. */
export function apiError(err, fallback = 'Algo deu errado. Tente de novo.') {
    return err?.response?.data?.error || err?.response?.data?.message || fallback;
}

// ───────── frete (route-shipping-fee-to-producer) ─────────
// O frete é do produtor: não entra na margem da loja nem na comissão. Aqui só se formata o que a API devolve.

export const DEBIT_TYPE_LABEL = { DEVOLUCAO: 'Devolução (produto e frete)', LOGISTICA_REVERSA: 'Logística reversa' };
export const debitTypeLabel = (t) => DEBIT_TYPE_LABEL[t] ?? t ?? '—';

const cents = (v) => Math.round(Number(v ?? 0) * 100);

/** Frete bruto, taxa do gateway e frete líquido (o que o produtor recebe), em reais; sem frete devolve `null`. */
export function freightBreakdown(order) {
    const bruto = cents(order?.valor_frete);
    if (!(bruto > 0)) return null;
    const taxa = cents(order?.valor_taxa_frete);
    return { bruto: bruto / 100, taxa: taxa / 100, liquido: (bruto - taxa) / 100 };
}

/** Texto curto para a coluna "Frete": "R$ 30,00 (produtor recebe R$ 28,50)" ou "—" quando não há frete. */
export function freightText(order) {
    const f = freightBreakdown(order);
    return f ? `${money(f.bruto)} (produtor recebe ${money(f.liquido)})` : '—';
}

/** Soma dos débitos em aberto de um beneficiário (centavos exatos). */
export function openDebitTotal(debits, userId) {
    const c = (debits ?? []).filter((d) => !userId || d.beneficiario_user_id === userId).reduce((s, d) => s + cents(d.valor), 0);
    return c / 100;
}

/** Mesma divisão do servidor: 50% para o produtor, 50% para o dropshipper, centavo ímpar para a ARPT (só pré-visualização). */
export function reverseLogisticsSplit(custo) {
    const total = cents(custo);
    if (!(total > 0)) return null;
    const metade = Math.floor(total / 2);
    return { produtor: metade / 100, dropshipper: metade / 100, arpt: (total - 2 * metade) / 100 };
}

/**
 * Valida o custo digitado (aceita vírgula). Teto: total pago pelo sub-pedido (produtos mais frete), igual ao servidor.
 * Devolve `{ ok, value }` ou `{ ok: false, error }`.
 */
export function parseReverseCost(raw, order) {
    const n = Number(String(raw ?? '').trim().replace(/\./g, '').replace(',', '.'));
    if (String(raw ?? '').trim() === '' || !Number.isFinite(n) || n <= 0) return { ok: false, error: 'Informe um custo maior que zero.' };
    const teto = cents(order?.valor_total) + cents(order?.valor_frete);
    if (Math.round(n * 100) > teto) return { ok: false, error: `O custo não pode passar do total pago pelo sub-pedido (${money(teto / 100)}).` };
    return { ok: true, value: Math.round(n * 100) / 100 };
}

/** Pedido devolvido que ainda aguarda o registro do custo da logística reversa. */
export const needsReverseCost = (order) => order?.status === 'DEVOLVIDO' && (order.custo_logistica_reversa === null || order.custo_logistica_reversa === undefined);
