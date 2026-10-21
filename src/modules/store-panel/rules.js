// Regras do painel da loja (puras): validação dos IDs de rastreio, "ativo/inativo", checklist de publicação e endereço da loja.
// Os formatos espelham o backend (src/schemas/storefront.schema.ts); o servidor valida de novo.

export const GTM_RE = /^GTM-[A-Z0-9]{4,10}$/;
export const GA4_RE = /^G-[A-Z0-9]{6,12}$/;
export const PIXEL_RE = /^\d{8,20}$/;
export const GOOGLE_VERIFICATION_RE = /^[A-Za-z0-9_-]{20,100}$/;

const TRACKING_FIELDS = [
  { key: 'gtm', re: GTM_RE, err: 'err_gtm' },
  { key: 'ga4', re: GA4_RE, err: 'err_ga4' },
  { key: 'pixel', re: PIXEL_RE, err: 'err_pixel' },
  { key: 'google_verificacao', re: GOOGLE_VERIFICATION_RE, err: 'err_google' },
];
const clean = (v) => (typeof v === 'string' ? v.trim() : '');

/** Erros por campo (chave de i18n), só dos campos preenchidos: vazio é válido (desliga aquele rastreio). */
export function validateTracking(values) {
  const errors = {};
  for (const { key, re, err } of TRACKING_FIELDS) {
    const v = clean(values?.[key]);
    if (v !== '' && !re.test(v)) errors[key] = err;
  }
  return errors;
}

/** Seção `tracking` para o rascunho: só campos preenchidos (a seção enviada substitui a anterior). */
export function buildTracking(values) {
  const out = {};
  for (const { key } of TRACKING_FIELDS) { const v = clean(values?.[key]); if (v !== '') out[key] = v; }
  const aviso = clean(values?.aviso_cookies);
  if (aviso !== '') out.aviso_cookies = aviso;
  return out;
}

/** Ativo = preenchido e válido. O rastreio só dispara na vitrine depois do consentimento do visitante. */
export function trackingStatus(values) {
  const errors = validateTracking(values);
  return Object.fromEntries(['gtm', 'ga4', 'pixel'].map((k) => [k, clean(values?.[k]) !== '' && !errors[k]]));
}

/** Seção `seo` do rascunho, preservando o SEO por produto que a tela não edita. */
export function buildSeo(values, previous) {
  const out = {};
  const titulo = clean(values?.titulo); const descricao = clean(values?.descricao); const og = clean(values?.imagem_og_url);
  if (titulo) out.titulo = titulo; if (descricao) out.descricao = descricao; if (og) out.imagem_og_url = og;
  if (previous?.produtos && Object.keys(previous.produtos).length) out.produtos = previous.produtos;
  return out;
}
export function validateSeo(values) {
  const errors = {};
  if (clean(values?.titulo).length > 70) errors.titulo = 'err_seo_title';
  if (clean(values?.descricao).length > 160) errors.descricao = 'err_seo_description';
  const og = clean(values?.imagem_og_url);
  if (og && !isImageUrl(og)) errors.imagem_og_url = 'err_image_url';
  return errors;
}

/** Imagem https com extensão permitida (a mesma regra do servidor; svg fica de fora de propósito). */
export function isImageUrl(v) {
  try { const u = new URL(v); return u.protocol === 'https:' && /\.(png|jpe?g|webp|gif|avif)$/i.test(u.pathname); } catch { return false; }
}
const HEX = /^#[0-9a-fA-F]{6}$/;
export const REQUIRED_COLORS = ['primaria', 'secundaria', 'fundo', 'texto'];
export const isColor = (v) => typeof v === 'string' && HEX.test(v);

/**
 * Erros do tema (chave de i18n por campo). As cores são todas ou nenhuma: o servidor recusa um tema com só algumas
 * (primária, secundária, fundo e texto são obrigatórias quando há cores; destaque é opcional).
 */
export function validateTema(tema) {
  const errors = {};
  for (const k of ['logo_url', 'favicon_url', 'banner_url']) if (clean(tema?.[k]) && !isImageUrl(tema[k])) errors[k] = 'err_image_url';
  const cores = tema?.cores ?? {};
  const filled = Object.keys(cores).filter((k) => clean(cores[k]) !== '');
  for (const k of filled) if (!isColor(cores[k])) errors[`cor_${k}`] = 'err_color';
  if (filled.length > 0) for (const k of REQUIRED_COLORS) if (clean(cores[k]) === '') errors[`cor_${k}`] = 'err_colors_all';
  return errors;
}

/** Dados do negócio (rodapé): razão social e um contato. */
export function businessComplete(negocio) {
  return clean(negocio?.razao_social) !== '' && (clean(negocio?.email) !== '' || clean(negocio?.telefone) !== '');
}

/**
 * Checklist para publicar. `required`: bloqueia o botão. `optional`: só informa (domínio próprio).
 * `products`: alocações da loja (`ativo`, `frete_calculavel`); `config`: rascunho da vitrine.
 */
export function publishChecklist({ products, config, domains }) {
  const active = (products ?? []).filter((p) => p.ativo);
  const items = [
    { id: 'product', required: true, ok: active.length > 0 },
    { id: 'shipping', required: false, ok: active.length > 0 && active.every((p) => p.frete_calculavel !== false) },
    { id: 'logo', required: true, ok: !!clean(config?.tema?.logo_url) },
    { id: 'business', required: true, ok: businessComplete(config?.rodape?.negocio) },
    { id: 'domain', required: false, ok: (domains ?? []).some((d) => d.tls_status === 'ATIVO') },
  ];
  const missing = items.filter((i) => i.required && !i.ok).map((i) => i.id);
  return { items, missing, canPublish: missing.length === 0 };
}

/**
 * Endereço público da loja: domínio próprio com TLS ativo, senão o subdomínio. Em desenvolvimento, `localUrl`
 * (ex.: http://localhost:3000) usa o modo `/store/<slug>`.
 */
export function storeUrl({ slug, domains, baseDomain, localUrl }) {
  if (!slug) return null;
  if (localUrl) return `${String(localUrl).replace(/\/$/, '')}/store/${slug}`;
  const own = (domains ?? []).find((d) => d.tls_status === 'ATIVO');
  return `https://${own ? own.dominio : `${slug}.${baseDomain || 'arpt.site'}`}`;
}

export const STORE_STATUS = { ATIVA: 'active', PAUSADA: 'paused', RASCUNHO: 'draft', SUSPENSA: 'suspended' };
export const statusKey = (s) => STORE_STATUS[s] ?? 'draft';
