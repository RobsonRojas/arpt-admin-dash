// Assistente de IA dos termos de uso (add-ai-terms-legal-assistant-and-translation). Funções puras: a IA só sugere, quem altera o editor é o administrador.

export const AVISO_IA = 'Sugestão de IA, não substitui revisão de profissional habilitado.';
export const MENSAGEM_IA_DESLIGADA = 'O assistente de IA está desligado. Você pode escrever e salvar o termo normalmente.';

export const TIPO_LABEL = { LACUNA: 'Lacuna', AMBIGUIDADE: 'Ambiguidade', RISCO: 'Risco', MELHORIA: 'Melhoria' };
export const GRAVIDADE_LABEL = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta' };
export const GRAVIDADE_COR = { BAIXA: 'default', MEDIA: 'warning', ALTA: 'error' };

/** Impressão digital curta (FNV-1a) do texto, só para saber se o português mudou depois da tradução. Fica no front, não vai ao banco. */
export function hashTexto(texto) {
    let h = 0x811c9dc5;
    const s = String(texto ?? '');
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
}

/** A tradução está desatualizada quando houve tradução por IA e o português de agora tem outro hash. */
export const traducaoDesatualizada = (hashUsado, portugues) => !!hashUsado && hashTexto(portugues) !== hashUsado;

/** Troca a primeira ocorrência do trecho pela sugestão. Se o trecho sumiu ou mudou, não altera nada. */
export function aplicarObservacao(texto, obs) {
    const trecho = obs?.trecho ?? '';
    if (!trecho.trim() || !String(obs?.sugestao ?? '').trim()) return { ok: false, texto };
    const i = texto.indexOf(trecho);
    if (i === -1) return { ok: false, texto };
    return { ok: true, texto: texto.slice(0, i) + obs.sugestao + texto.slice(i + trecho.length) };
}

/** Traduz o erro da API em mensagem e estado da interface (a escrita manual segue funcionando). */
export function descreverErroIa(err) {
    const status = err?.response?.status;
    const data = err?.response?.data ?? {};
    if (status === 503) return { desligada: true, mensagem: data.error || MENSAGEM_IA_DESLIGADA };
    if (status === 429) {
        const s = Number(data.retryAfterSeconds ?? err?.response?.headers?.['retry-after']) || null;
        return { limite: true, mensagem: s ? `Muitas chamadas ao assistente. Tente de novo em ${s} s.` : 'Muitas chamadas ao assistente. Tente de novo em instantes.' };
    }
    if (status === 413) return { mensagem: data.error || 'O texto é grande demais para o assistente.' };
    if (status === 403) return { mensagem: 'Apenas administradores podem usar o assistente.' };
    return { mensagem: data.error || 'Não foi possível usar o assistente agora. O texto digitado foi mantido.' };
}
