// Assistente de IA da vitrine (add-ai-storefront-customization): funções puras do painel. O servidor valida e grava de novo.

export const AI_SECTIONS = ['tema', 'blocos', 'paginas', 'menu', 'rodape', 'seo'];
export const MAX_REQUEST = 2000;

/** Corpo do pedido: texto aparado e idiomas na ordem pt, en. `null` se não dá para enviar. */
export function proposeBody(pedido, idiomas) {
  const texto = String(pedido ?? '').trim();
  const langs = ['pt', 'en'].filter((l) => idiomas?.includes(l));
  if (texto.length < 3 || texto.length > MAX_REQUEST || !langs.length) return null;
  return { pedido: texto, idiomas: langs };
}

/** Conteúdo atual do rascunho no formato da proposta (`paginas` como lista com endereço; `menu` só com páginas). */
function draftContent(draft, lang) {
  const base = !draft?.idioma_padrao || draft.idioma_padrao === lang || (!draft?.idiomas && lang === 'pt');
  const c = base ? draft : draft?.traducoes?.[lang];
  return {
    blocos: c?.blocos ?? [],
    paginas: Object.entries(c?.paginas ?? {}).map(([endereco, p]) => ({ endereco, titulo: p.titulo, blocos: p.blocos })),
    menu: (c?.menu ?? []).map((m) => ({ rotulo: m.rotulo, destino: m.destino })),
    rodape: { texto: c?.rodape?.texto ?? '' },
    seo: { titulo: c?.seo?.titulo ?? '', descricao: c?.seo?.descricao ?? '' },
  };
}
const proposalContent = (c) => ({
  blocos: c?.blocos ?? [],
  paginas: Object.entries(c?.paginas ?? {}).map(([endereco, p]) => ({ endereco, titulo: p.titulo, blocos: p.blocos })),
  menu: (c?.menu ?? []).map((m) => ({ rotulo: m.rotulo, destino: m.destino })),
  rodape: { texto: c?.rodape?.texto ?? '' },
  seo: { titulo: c?.seo?.titulo ?? '', descricao: c?.seo?.descricao ?? '' },
});
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Diferença por seção entre o rascunho e a proposta: `changed` diz se aceitar muda algo; `summary` resume para a tela
 * (quantos blocos, páginas e itens de menu; cores e fonte do tema; o texto de rodapé e SEO).
 */
export function sectionDiff(draft, proposal, lang) {
  const out = {};
  const temaAtual = { cores: draft?.tema?.cores ?? null, fonte: draft?.tema?.fonte ?? null, estilo_botoes: draft?.tema?.estilo_botoes ?? null, estilo_cards: draft?.tema?.estilo_cards ?? null };
  out.tema = { changed: !same(temaAtual, proposal?.tema ?? {}), before: temaAtual, after: proposal?.tema ?? null };
  const atual = draftContent(draft, lang);
  const nova = proposalContent(proposal?.conteudo?.[lang]);
  for (const s of ['blocos', 'paginas', 'menu', 'rodape', 'seo']) out[s] = { changed: !same(atual[s], nova[s]), before: atual[s], after: nova[s] };
  return out;
}

/** Seções escolhidas para aceitar, na ordem do servidor; só as conhecidas. */
export function acceptBody(propostaId, sections) {
  const secoes = AI_SECTIONS.filter((s) => sections?.includes(s));
  if (!propostaId || !secoes.length) return null;
  return { proposta_id: propostaId, secoes };
}

/** Configuração de pré-visualização da proposta num idioma (para o mesmo desenho da galeria de templates). */
export const previewConfig = (proposal, lang) => ({ tema: proposal?.tema ?? {}, blocos: proposal?.conteudo?.[lang]?.blocos ?? [] });

/** Horário de liberação do limite, no fuso do navegador. */
export const releaseTime = (iso, lang) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};
