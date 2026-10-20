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
