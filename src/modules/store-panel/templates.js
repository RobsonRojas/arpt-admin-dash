// Galeria de templates da loja (add-dropshipper-store-template-library): funções puras. O servidor compõe e valida de novo.

/** Texto no idioma do painel, de um par `{ pt, en }` vindo da API. */
export const inLang = (b, lang) => (b && typeof b === 'object' ? (b[lang] ?? b.pt ?? '') : (b ?? ''));

/** Templates da categoria e do estilo escolhidos (vazio = todos). */
export function filterTemplates(templates, { categoria, estilo } = {}) {
  return (templates ?? []).filter((t) => (!categoria || t.categoria === categoria) && (!estilo || t.estilo === estilo));
}

/** Combinação de peças: de um template curado, ou livre (layout, paleta e estilo escolhidos à mão). */
export function combination({ template, layout, paleta, estilo }) {
  if (template) return { template };
  if (layout && paleta && estilo) return { layout, paleta, estilo };
  return null;
}

/** Corpo do POST de aplicar: peças, escopo e idiomas do conteúdo. */
export function applyBody(comb, escopo, idiomas) {
  if (!comb) return null;
  if (!['tudo', 'tema', 'blocos'].includes(escopo)) return null;
  const langs = ['pt', 'en'].filter((l) => idiomas?.includes(l));
  if (!langs.length) return null;
  return { ...comb, escopo, idiomas: langs };
}

/** Idiomas que a loja já usa no rascunho (ponto de partida da escolha ao aplicar). */
export const storeLanguages = (config) => (Array.isArray(config?.idiomas) && config.idiomas.length ? config.idiomas : ['pt']);

// ── contraste (WCAG 2.x), para mostrar ao lado da paleta
const channel = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function luminance(hex) {
  let h = String(hex ?? '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
/** Razão de contraste entre duas cores; `null` se alguma não for válida. */
export function contrastRatio(a, b) {
  const la = luminance(a); const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [x, y] = la > lb ? [la, lb] : [lb, la];
  return (x + 0.05) / (y + 0.05);
}
/** A paleta é legível: texto sobre o fundo e o texto branco do botão sobre a primária, ambos em 4,5:1 ou mais. */
export const paletteReadable = (cores) => (contrastRatio(cores?.texto, cores?.fundo) ?? 0) >= 4.5 && (contrastRatio('#FFFFFF', cores?.primaria) ?? 0) >= 4.5;

/** Blocos ainda com texto de exemplo de template (o checklist avisa antes de publicar). */
export function exampleBlocks(config) {
  const ids = [];
  (config?.blocos ?? []).forEach((b) => b?.exemplo && ids.push(b.id));
  for (const [slug, p] of Object.entries(config?.paginas ?? {})) (p?.blocos ?? []).forEach((b) => b?.exemplo && ids.push(`${slug}/${b.id}`));
  return ids;
}

/** Produtos de exemplo da pré-visualização: fixos, sem chamar a API de nenhuma loja. */
export const SAMPLE_PRODUCTS = [
  { id: 1, nome: { pt: 'Produto de exemplo 1', en: 'Sample product 1' } },
  { id: 2, nome: { pt: 'Produto de exemplo 2', en: 'Sample product 2' } },
  { id: 3, nome: { pt: 'Produto de exemplo 3', en: 'Sample product 3' } },
  { id: 4, nome: { pt: 'Produto de exemplo 4', en: 'Sample product 4' } },
];
