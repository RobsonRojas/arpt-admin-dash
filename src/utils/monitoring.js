// Regras de tela do monitoramento de serviços e filas (add-admin-service-monitoring). O servidor valida de novo.

export const MOTIVO_MIN = 10;
export const MOTIVO_MAX = 200;
export const LIMITE_LOTE = 50;

export const ESTADOS_SERVICO = {
    up: { rotulo: 'Em execução', cor: 'success' },
    down: { rotulo: 'Fora do ar', cor: 'error' },
    unknown: { rotulo: 'Desconhecido', cor: 'default' },
};
export const estadoServico = (e) => ESTADOS_SERVICO[e] ?? ESTADOS_SERVICO.unknown;

export const ESTADOS_JOB = [
    ['waiting', 'Aguardando'],
    ['active', 'Em execução'],
    ['delayed', 'Agendados'],
    ['failed', 'Falhos'],
    ['completed', 'Concluídos'],
];
export const rotuloEstadoJob = (e) => (ESTADOS_JOB.find(([v]) => v === e) ?? [e, e])[1];

/** Reiniciar estes derruba o site ou o login por alguns segundos: a confirmação avisa. */
const DERRUBAM_O_SITE = new Set(['arpt-db', 'redis_manejo', 'nginx', 'keycloak', 'manejo-app']);
export const avisoReinicio = (nome) => (DERRUBAM_O_SITE.has(nome)
    ? `Reiniciar ${nome} deixa o site (ou o login) fora do ar por alguns segundos.`
    : `O serviço ${nome} para e volta; o que estiver em andamento nele é interrompido.`);

/** Erro do motivo, ou `''` quando pode enviar. */
export const erroMotivo = (motivo) => {
    const n = String(motivo ?? '').trim().length;
    if (n < MOTIVO_MIN) return `Explique o motivo em pelo menos ${MOTIVO_MIN} caracteres.`;
    if (n > MOTIVO_MAX) return `O motivo pode ter no máximo ${MOTIVO_MAX} caracteres.`;
    return '';
};

/** Mensagem do servidor (`error` nas rotas de monitoramento, `message` nas outras), ou a padrão. */
export const mensagemServidor = (err, padrao) => err?.response?.data?.error || err?.response?.data?.message || padrao;

/** Duração legível desde `desde` até `agora` (ms). */
export const duracaoDesde = (desde, agora = Date.now()) => {
    if (!desde) return '—';
    const ms = agora - new Date(desde).getTime();
    if (!Number.isFinite(ms) || ms < 0) return '—';
    const min = Math.floor(ms / 60000);
    if (min < 1) return 'menos de 1 min';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 48) return `${h} h ${min % 60} min`;
    return `${Math.floor(h / 24)} dias`;
};

export const dataHora = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleString('pt-BR');
};

/** Resultado de reenfileirar ou limpar, em uma frase. */
export const resumoAcaoFila = (r, acao) => {
    const feitos = acao === 'retry' ? (r?.reenfileirados?.length ?? 0) : (r?.removidos ?? 0);
    const partes = [`${feitos} ${acao === 'retry' ? 'reenfileirado(s)' : 'removido(s)'}`];
    if (r?.ignorados) partes.push(`${r.ignorados} ignorado(s) por não estarem mais no estado (ex.: em execução)`);
    if (r?.nao_encontrados) partes.push(`${r.nao_encontrados} não encontrado(s)`);
    return partes.join('; ') + '.';
};

// ───────── situação das filas (isolate-dropshipping-maintenance-jobs) ─────────

/** Limite de espera usado se a API antiga não o informar; o servidor manda o valor real (`QUEUE_STALE_MINUTES`) junto das filas. */
export const LIMITE_FILA_PARADA_PADRAO_S = 900;

/** Duração legível de um número de segundos (a espera mais antiga da fila). */
export const duracaoSegundos = (s) => {
    if (s === null || s === undefined || !Number.isFinite(Number(s)) || Number(s) < 0) return '—';
    const agora = Date.now();
    return duracaoDesde(new Date(agora - Number(s) * 1000).toISOString(), agora);
};

/**
 * Situação de uma fila para a tabela. Espera velha SEM nenhum job em execução = parada (ninguém processa: o mesmo critério do alerta ao
 * administrador); espera velha COM job em execução = lenta; resto = normal. Fila sem job esperando não tem espera. A tela só destaca; quem
 * decide o alerta é o servidor.
 */
export function situacaoFila(fila, limiteSegundos = LIMITE_FILA_PARADA_PADRAO_S) {
    const espera = fila?.espera_mais_antiga_segundos;
    if (espera === null || espera === undefined) return { nivel: 'ok', rotulo: 'Sem espera', espera: null };
    const emExecucao = Number(fila?.contagens?.active ?? 0);
    if (espera >= limiteSegundos && emExecucao === 0) return { nivel: 'error', rotulo: 'Parada', espera, dica: 'Há jobs esperando e nenhum em execução: confira se o worker está no ar.' };
    if (espera >= limiteSegundos) return { nivel: 'warning', rotulo: 'Lenta', espera, dica: 'Há jobs esperando há muito tempo, mas a fila está processando.' };
    return { nivel: 'ok', rotulo: 'Normal', espera };
}
