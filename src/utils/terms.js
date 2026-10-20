// Termos de uso por público (route-shipping-fee-to-producer). Funções puras: o servidor decide versão e vigência.

export const AUDIENCES = ['GERAL', 'PRODUTOR', 'DROPSHIPPER'];
export const AUDIENCE_LABEL = { GERAL: 'Geral', PRODUTOR: 'Produtor (app Manejar)', DROPSHIPPER: 'Dropshipper (manejo-app)' };
export const audienceLabel = (a) => AUDIENCE_LABEL[a] ?? a ?? '—';

/** Só os públicos que têm aceite pendente a acompanhar (o geral não tem lista de pendentes). */
export const PENDING_AUDIENCES = ['PRODUTOR', 'DROPSHIPPER'];

/** Termos de um público; termos antigos sem o campo contam como GERAL. */
export const termsOf = (terms, audience) => (terms ?? []).filter((t) => (t.audience ?? 'GERAL') === audience);

/** O termo vigente do público: o publicado mais recente. */
export function currentTerm(terms, audience) {
    const pub = termsOf(terms, audience).filter((t) => t.status === 'published');
    return pub.sort((a, b) => new Date(b.published_at) - new Date(a.published_at) || b.id - a.id)[0] ?? null;
}

/** Corpo da API ao salvar rascunho. Inglês vazio vira `null` (o app cai para o português). */
export function draftPayload({ content, contentEn, audience, clauseFreight, basedOnId }) {
    const en = (contentEn ?? '').trim();
    return {
        content_md: content,
        audience,
        content_md_en: en ? contentEn : null,
        contem_clausula_frete: !!clauseFreight,
        ...(basedOnId ? { based_on_id: basedOnId } : {}),
    };
}

/** Pode publicar? Termo do produtor/dropshipper com a marca do frete exige texto em português e em inglês. */
export function publishBlockers(term) {
    const out = [];
    if (!term?.content_md || !term.content_md.trim()) out.push('O texto em português está vazio.');
    if (term?.contem_clausula_frete && !(term.content_md_en ?? '').trim()) {
        out.push('A marca da cláusula do frete está ligada, mas falta a versão em inglês.');
    }
    return out;
}

/** Aviso mostrado antes de publicar. */
export function publishWarning(term) {
    const base = 'Ao publicar, esta versão passa a ser a vigente e não poderá mais ser alterada.';
    const who = { PRODUTOR: ' Os produtores terão de aceitá-la antes de aceitar novos pedidos.', DROPSHIPPER: ' Os dropshippers terão de aceitá-la para criar lojas e alocar produtos.' };
    const frete = term?.contem_clausula_frete ? ' Esta versão está marcada como contendo a cláusula do frete.' : '';
    return base + (who[term?.audience] ?? '') + frete;
}

/** Nome exibido de quem ainda não aceitou (produtor tem nome/e-mail; dropshipper tem nome comercial). */
export function pendingName(p) {
    const nome = p?.nome_comercial || [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim();
    return nome || p?.email || p?.user_id || '—';
}
