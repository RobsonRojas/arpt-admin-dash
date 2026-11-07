// Regras de tela do console de crescimento do administrador (donos, certificação de carbono, mural).
// O servidor valida de novo; aqui é só para o erro aparecer antes do envio.

const DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Data AAAA-MM-DD que existe no calendário (31/02 não passa). */
export const dataValida = (s) => {
    if (typeof s !== 'string' || !DATA.test(s)) return false;
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

/** Erros do formulário de certificação, por campo. Objeto vazio = pode enviar. */
export const errosCertificacao = (f) => {
    const e = {};
    for (const [campo, rotulo] of [['padrao', 'o padrão'], ['registro_numero', 'o número de registro'], ['entidade', 'a entidade emissora']]) {
        if (!String(f[campo] ?? '').trim()) e[campo] = `Informe ${rotulo}.`;
    }
    const q = Number(String(f.quantidade_tco2e ?? '').replace(',', '.'));
    if (!String(f.quantidade_tco2e ?? '').trim() || !Number.isFinite(q) || q <= 0) e.quantidade_tco2e = 'A quantidade precisa ser maior que zero.';
    if (!dataValida(f.vigencia_inicio)) e.vigencia_inicio = 'Data inválida.';
    if (!dataValida(f.vigencia_fim)) e.vigencia_fim = 'Data inválida.';
    else if (!e.vigencia_inicio && f.vigencia_fim < f.vigencia_inicio) e.vigencia_fim = 'A vigência termina antes de começar.';
    return e;
};

/** Corpo do POST, no formato estrito do servidor (quantidade como número). */
export const corpoCertificacao = (f) => ({
    padrao: f.padrao.trim(),
    registro_numero: f.registro_numero.trim(),
    entidade: f.entidade.trim(),
    quantidade_tco2e: Number(String(f.quantidade_tco2e).replace(',', '.')),
    vigencia_inicio: f.vigencia_inicio,
    vigencia_fim: f.vigencia_fim,
});

/** Aviso mostrado antes de revogar: diz quantos relatórios publicados saem do ar. */
export const avisoRevogacao = (n) => {
    const k = Number(n) || 0;
    if (k === 0) return 'Nenhum relatório publicado depende desta certificação.';
    return k === 1
        ? '1 relatório de impacto publicado será despublicado e sairá da página pública.'
        : `${k} relatórios de impacto publicados serão despublicados e sairão da página pública.`;
};

/** Mensagem do servidor, com os detalhes de validação quando houver. */
export const mensagemErro = (err, padrao) => {
    const d = err?.response?.data;
    const detalhes = Array.isArray(d?.detalhes) && d.detalhes.length ? ` ${d.detalhes.join(' ')}` : '';
    return (d?.message || padrao) + detalhes;
};

/** Só quem escolheu aparecer, com o que o mural mostra. Nada além disso sai da resposta. */
export const escolhasDoMural = (lista) => (Array.isArray(lista) ? lista : [])
    .filter((r) => (r.modo === 'NOME' && r.nome_exibicao) || (r.modo === 'LOGO' && r.logo_url))
    .map((r) => ({ patrocinio: r.patrocinio, modo: r.modo, nome_exibicao: r.modo === 'NOME' ? r.nome_exibicao : null, logo_url: r.modo === 'LOGO' ? r.logo_url : null, atualizado_em: r.atualizado_em }));

export const dataBr = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export const nomeUsuario = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.username || u?.email || u?.id || '';
