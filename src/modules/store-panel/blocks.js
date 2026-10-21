// Edição de blocos (pura): criar, mover e remover blocos e páginas. O servidor valida e sanitiza tudo de novo.
export const PAGE_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,38})[a-z0-9]$|^[a-z0-9]$/;
export const RESERVED_PAGES = ['produto', 'produtos', 'carrinho', 'checkout', 'api', 'store', 'loja', 'admin', 'sitemap', 'robots'];

/** Blocos que a tela edita; os demais tipos (faq, depoimentos...) são preservados como estão. */
export const EDITABLE_TYPES = ['hero', 'texto', 'produtos_destaque', 'imagem', 'contato', 'newsletter'];

/** Campos de cada tipo: `[chave, tipo do campo]` (`text` | `long` | `number`). */
export const BLOCK_FIELDS = {
  hero: [['titulo', 'text'], ['subtitulo', 'text'], ['botao_texto', 'text'], ['botao_link', 'text'], ['imagem_url', 'text']],
  texto: [['html', 'long']],
  produtos_destaque: [['titulo', 'text'], ['quantidade', 'number']],
  imagem: [['url', 'text'], ['alt', 'text'], ['link', 'text']],
  contato: [['email', 'text'], ['telefone', 'text'], ['texto', 'long']],
  newsletter: [['titulo', 'text'], ['texto', 'long']],
};
const DEFAULTS = {
  hero: { titulo: 'Título' }, texto: { html: '<p>Texto</p>' }, produtos_destaque: { quantidade: 8 },
  imagem: { url: '', alt: '' }, contato: {}, newsletter: { titulo: 'Newsletter' },
};

/** Id único dentro da lista, no formato aceito pelo servidor (minúsculas, números e hífen). */
export function newBlockId(blocos, tipo) {
  const used = new Set((blocos ?? []).map((b) => b.id));
  const base = tipo.replace(/_/g, '-');
  for (let n = 1; ; n += 1) { const id = `${base}-${n}`; if (!used.has(id)) return id; }
}
export const addBlock = (blocos, tipo) => [...(blocos ?? []), { id: newBlockId(blocos, tipo), tipo, ...(DEFAULTS[tipo] ?? {}) }];
export const removeBlock = (blocos, id) => (blocos ?? []).filter((b) => b.id !== id);
export function moveBlock(blocos, id, delta) {
  const list = [...(blocos ?? [])]; const i = list.findIndex((b) => b.id === id); const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return list;
  [list[i], list[j]] = [list[j], list[i]];
  return list;
}
/** Troca um campo; vazio remove o campo (os opcionais saem do bloco). Número vira inteiro. */
export function setBlockField(blocos, id, key, value, kind = 'text') {
  return (blocos ?? []).map((b) => {
    if (b.id !== id) return b;
    const next = { ...b };
    if (value === '' || value === null || value === undefined) delete next[key];
    else next[key] = kind === 'number' ? Number(value) : value;
    return next;
  });
}

export function validatePageSlug(slug, existing) {
  const s = String(slug ?? '').trim().toLowerCase();
  if (!PAGE_SLUG.test(s)) return 'err_page_slug';
  if (RESERVED_PAGES.includes(s)) return 'err_page_reserved';
  if (Object.prototype.hasOwnProperty.call(existing ?? {}, s)) return 'err_page_exists';
  return null;
}
export const addPage = (paginas, slug, titulo) => ({ ...(paginas ?? {}), [String(slug).trim().toLowerCase()]: { titulo: String(titulo).trim(), blocos: [] } });
export function removePage(paginas, slug) { const { [slug]: _gone, ...rest } = paginas ?? {}; return rest; }
