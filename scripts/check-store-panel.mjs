import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as i18n from '../src/modules/store-panel/i18n.js';
import * as perm from '../src/modules/store-panel/permissions.js';
import * as rules from '../src/modules/store-panel/rules.js';
import * as err from '../src/modules/store-panel/errors.js';
import * as blocks from '../src/modules/store-panel/blocks.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/modules/store-panel');
const { pt, en } = i18n.DICTIONARIES;

// ── idiomas: as mesmas chaves nos dois, nenhum texto vazio, mesmos {parâmetros}
const diff = i18n.keyDiff();
assert.deepEqual(diff, { onlyPt: [], onlyEn: [] }, `chaves só em um idioma: ${JSON.stringify(diff)}`);
const params = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
for (const k of Object.keys(pt)) { assert.ok(pt[k].trim() && en[k].trim(), `texto vazio: ${k}`); assert.equal(params(pt[k]), params(en[k]), `parâmetros diferentes em ${k}`); }
assert.notEqual(pt.save, en.save);
assert.equal(i18n.translate('en', 'version', { n: 3 }), 'Version 3');
assert.equal(i18n.translate('pt', 'version', { n: 3 }), 'Versão 3');
assert.equal(i18n.translate('en', 'chave_que_nao_existe'), 'chave_que_nao_existe');
assert.equal(i18n.translate('fr', 'save'), pt.save);
assert.equal(i18n.initialLang('en'), 'en'); assert.equal(i18n.initialLang('pt'), 'pt');
for (const v of [null, undefined, '', 'xx', 'EN']) assert.equal(i18n.initialLang(v), 'pt'); // sem escolha, português (o navegador não decide)

// ── o código só usa chaves que existem (estáticas, dinâmicas por prefixo e as devolvidas pelas regras)
const files = [...fs.readdirSync(dir).filter((f) => /\.(jsx?|)$/.test(f) && f !== 'i18n.js').map((f) => path.join(dir, f)), ...fs.readdirSync(path.join(dir, 'sections')).map((f) => path.join(dir, 'sections', f))].filter((f) => fs.statSync(f).isFile());
const used = new Set(); const dynamic = new Set();
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)) used.add(m[1]);
  for (const m of src.matchAll(/\bt\(`([A-Za-z0-9_]+_)\$\{/g)) dynamic.add(m[1]);
  for (const m of src.matchAll(/'((?:err|check)_[a-z_]+)'/g)) used.add(m[1]);
}
for (const k of used) assert.ok(k in pt, `chave usada e sem texto: ${k}`);
const VALUES = {
  role_: perm.ROLES, menu_: perm.SECTIONS.map((s) => s.id), status_: Object.values(rules.STORE_STATUS), block_: ['hero', 'produtos_destaque', 'texto', 'imagem', 'faq', 'depoimentos', 'newsletter', 'contato'],
  color_: ['primaria', 'secundaria', 'fundo', 'texto', 'destaque'], font_: ['sistema', 'serifada', 'moderna', 'arredondada', 'monoespacada'],
  button_: ['arredondado', 'quadrado', 'pilula'], card_: ['sombra', 'borda', 'plano'], domain_: ['PENDENTE', 'VERIFICADO'], tls_: ['ATIVO', 'EMITINDO', 'FALHA'],
  check_: ['product', 'shipping', 'logo', 'business', 'domain'], field_: [...new Set(Object.values(blocks.BLOCK_FIELDS).flat().map(([k]) => k))],
};
for (const p of dynamic) { assert.ok(VALUES[p], `prefixo dinâmico sem lista de valores no teste: ${p}`); for (const v of VALUES[p]) assert.ok(`${p}${v}` in pt, `falta ${p}${v}`); }
for (const c of err.KNOWN_CODES) assert.ok(`api_${c}` in pt, `falta o texto do erro ${c}`);
assert.ok('api_GENERIC' in pt);

// ── permissões por papel (spec dropshipper-store-panel)
assert.deepEqual(perm.menuFor('dono'), ['overview', 'products', 'orders', 'appearance', 'pages', 'domain', 'marketing', 'team', 'settings']);
const editor = perm.menuFor('editor');
for (const s of ['products', 'appearance', 'pages', 'marketing']) assert.ok(editor.includes(s), `editor deve ver ${s}`);
for (const s of ['orders', 'team', 'domain', 'settings']) assert.ok(!editor.includes(s), `editor não vê ${s}`);
const fin = perm.menuFor('financeiro');
assert.ok(fin.includes('orders')); for (const s of ['appearance', 'pages', 'marketing', 'team', 'domain']) assert.ok(!fin.includes(s), `financeiro não vê ${s}`);
assert.equal(perm.accessFor('financeiro', 'products'), 'view'); assert.equal(perm.accessFor('financeiro', 'orders'), 'view'); assert.equal(perm.accessFor('financeiro', 'appearance'), null);
assert.equal(perm.accessFor('editor', 'appearance'), 'edit'); assert.equal(perm.accessFor('dono', 'team'), 'edit');
for (const bad of [null, undefined, 'admin', '']) { assert.deepEqual(perm.menuFor(bad), []); assert.equal(perm.defaultSection(bad), null); }
assert.equal(perm.accessFor('dono', 'inexistente'), null);
assert.equal(perm.defaultSection('financeiro'), 'overview');
assert.equal(perm.canChangeStoreStatus('dono'), true); assert.equal(perm.canChangeStoreStatus('editor'), false);
assert.equal(perm.canPublishConfig('editor'), true); assert.equal(perm.canPublishConfig('financeiro'), false);

// ── validação dos IDs de rastreio
assert.deepEqual(rules.validateTracking({ gtm: 'GTM-ABC123', ga4: 'G-ABCDE12345', pixel: '123456789012345' }), {});
assert.deepEqual(rules.validateTracking({}), {}); assert.deepEqual(rules.validateTracking({ gtm: '  ', ga4: '' }), {});
assert.deepEqual(rules.validateTracking({ gtm: 'GTM-abc', ga4: 'UA-1', pixel: '12ab', google_verificacao: 'curto' }), { gtm: 'err_gtm', ga4: 'err_ga4', pixel: 'err_pixel', google_verificacao: 'err_google' });
assert.deepEqual(rules.validateTracking({ gtm: 'GTM-ABC123"><script>' }), { gtm: 'err_gtm' });
assert.deepEqual(rules.buildTracking({ gtm: ' GTM-ABC123 ', ga4: '', pixel: '12345678', aviso_cookies: ' oi ' }), { gtm: 'GTM-ABC123', pixel: '12345678', aviso_cookies: 'oi' });
assert.deepEqual(rules.trackingStatus({ gtm: 'GTM-ABC123', ga4: 'xx', pixel: '' }), { gtm: true, ga4: false, pixel: false });
assert.deepEqual(rules.validateSeo({ titulo: 'x'.repeat(71), descricao: 'y'.repeat(161), imagem_og_url: 'http://a.com/x.png' }), { titulo: 'err_seo_title', descricao: 'err_seo_description', imagem_og_url: 'err_image_url' });
assert.deepEqual(rules.validateSeo({ imagem_og_url: 'https://a.com/x.svg' }), { imagem_og_url: 'err_image_url' }); assert.deepEqual(rules.validateSeo({ imagem_og_url: 'https://a.com/x.PNG' }), {});
assert.deepEqual(rules.buildSeo({ titulo: 'T', descricao: '', imagem_og_url: '' }, { produtos: { 5: { titulo: 'P' } } }), { titulo: 'T', produtos: { 5: { titulo: 'P' } } });
assert.deepEqual(rules.validateTema({}), {}); assert.deepEqual(rules.validateTema({ cores: {} }), {});
assert.deepEqual(rules.validateTema({ cores: { primaria: '#112233', secundaria: '#112233', fundo: '#ffffff', texto: '#000000' } }), {});
assert.deepEqual(rules.validateTema({ cores: { primaria: '#112233' } }), { cor_secundaria: 'err_colors_all', cor_fundo: 'err_colors_all', cor_texto: 'err_colors_all' });
assert.deepEqual(rules.validateTema({ cores: { primaria: 'azul', secundaria: '#112233', fundo: '#ffffff', texto: '#000000' } }), { cor_primaria: 'err_color' });
assert.deepEqual(rules.validateTema({ cores: { destaque: '#112233' } }), { cor_primaria: 'err_colors_all', cor_secundaria: 'err_colors_all', cor_fundo: 'err_colors_all', cor_texto: 'err_colors_all' });
assert.deepEqual(rules.validateTema({ logo_url: 'http://a.com/x.png', banner_url: 'https://a.com/x.png' }), { logo_url: 'err_image_url' });
assert.equal(rules.isColor('#a1B2c3'), true); for (const bad of ['red', '#fff', '#12345g', '', null]) assert.equal(rules.isColor(bad), false);

// ── checklist de publicação
const ok = { products: [{ ativo: true, frete_calculavel: true }], config: { tema: { logo_url: 'https://a.com/l.png' }, rodape: { negocio: { razao_social: 'X Ltda', email: 'a@b.com' } } }, domains: [] };
assert.equal(rules.publishChecklist(ok).canPublish, true);
assert.deepEqual(rules.publishChecklist({ ...ok, products: [] }).missing, ['product']);
assert.deepEqual(rules.publishChecklist({ ...ok, products: [{ ativo: false }] }).missing, ['product']);
assert.deepEqual(rules.publishChecklist({ ...ok, config: {} }).missing, ['logo', 'business']);
assert.deepEqual(rules.publishChecklist({ products: [], config: null, domains: null }).missing, ['product', 'logo', 'business']);
assert.equal(rules.publishChecklist({ ...ok, config: { ...ok.config, rodape: { negocio: { razao_social: 'X' } } } }).canPublish, false);
assert.equal(rules.publishChecklist({ ...ok, config: { ...ok.config, rodape: { negocio: { telefone: '11 99999-0000' } } } }).canPublish, false);
const item = (c, id) => rules.publishChecklist(c).items.find((i) => i.id === id);
assert.equal(item(ok, 'domain').ok, false); assert.equal(item(ok, 'domain').required, false);
assert.equal(item({ ...ok, domains: [{ tls_status: 'ATIVO' }] }, 'domain').ok, true); assert.equal(item({ ...ok, domains: [{ tls_status: 'FALHA' }] }, 'domain').ok, false);
assert.equal(item({ ...ok, products: [{ ativo: true, frete_calculavel: false }] }, 'shipping').ok, false);
assert.equal(rules.publishChecklist({ ...ok, products: [{ ativo: true, frete_calculavel: false }] }).canPublish, true); // frete só avisa

// ── endereço da loja
assert.equal(rules.storeUrl({ slug: 'a', domains: [], baseDomain: 'arpt.site' }), 'https://a.arpt.site');
assert.equal(rules.storeUrl({ slug: 'a', domains: [{ dominio: 'x.com', tls_status: 'ATIVO' }] }), 'https://x.com');
assert.equal(rules.storeUrl({ slug: 'a', domains: [{ dominio: 'x.com', tls_status: 'EMITINDO' }] }), 'https://a.arpt.site');
assert.equal(rules.storeUrl({ slug: 'a', localUrl: 'http://localhost:3000/' }), 'http://localhost:3000/store/a'); assert.equal(rules.storeUrl({}), null);
assert.equal(rules.statusKey('ATIVA'), 'active'); assert.equal(rules.statusKey('SUSPENSA'), 'suspended'); assert.equal(rules.statusKey('x'), 'draft');

// ── erros da API pelo código
const e = (status, code) => ({ response: { status, data: { code } } });
// os códigos de DOMÍNIO que a API realmente devolve (backend/manejo-api/src/services/storefront/domains.services.ts)
for (const c of ['DOMAIN_IN_USE', 'DOMAIN_LIMIT', 'DOMAIN_NOT_FOUND', 'INVALID_DOMAIN', 'RESERVED_DOMAIN', 'VERIFY_TOO_SOON']) assert.equal(err.errorKey(e(409, c)), `api_${c}`, c);
assert.equal(err.errorKey(e(401, undefined)), 'api_UNAUTHORIZED'); assert.ok(!err.KNOWN_CODES.includes('DOMAIN_TAKEN'));
assert.equal(err.errorKey(e(422, 'NO_ACTIVE_PRODUCTS')), 'api_NO_ACTIVE_PRODUCTS'); assert.equal(err.errorKey(e(404, undefined)), 'api_STORE_NOT_FOUND');
assert.equal(err.errorKey(e(403, undefined)), 'api_FORBIDDEN'); assert.equal(err.errorKey(e(429, undefined)), 'api_RATE_LIMIT');
assert.equal(err.errorKey(e(500, 'CODIGO_NOVO')), 'api_GENERIC'); assert.equal(err.errorKey(new Error('rede')), 'api_GENERIC'); assert.equal(err.errorKey(null), 'api_GENERIC');
assert.deepEqual(err.fieldErrors({ response: { data: { detalhes: [{ campo: 'tracking.gtm', mensagem: 'x' }, { mensagem: 'sem campo' }] } } }), { 'tracking.gtm': 'x' });

// ── edição de blocos
let b = blocks.addBlock([], 'hero'); b = blocks.addBlock(b, 'hero'); b = blocks.addBlock(b, 'texto');
assert.deepEqual(b.map((x) => x.id), ['hero-1', 'hero-2', 'texto-1']);
assert.ok(b.every((x) => /^[a-z0-9](?:[a-z0-9-]{0,38})[a-z0-9]$/.test(x.id)));
assert.deepEqual(blocks.addBlock([{ id: 'produtos-destaque-1', tipo: 'produtos_destaque' }], 'produtos_destaque').map((x) => x.id), ['produtos-destaque-1', 'produtos-destaque-2']);
assert.deepEqual(blocks.moveBlock(b, 'texto-1', -1).map((x) => x.id), ['hero-1', 'texto-1', 'hero-2']);
assert.deepEqual(blocks.moveBlock(b, 'hero-1', -1).map((x) => x.id), ['hero-1', 'hero-2', 'texto-1']); // já é o primeiro
assert.deepEqual(blocks.moveBlock(b, 'texto-1', 1).map((x) => x.id), ['hero-1', 'hero-2', 'texto-1']); // já é o último
assert.deepEqual(blocks.moveBlock(b, 'nao-existe', 1).map((x) => x.id), ['hero-1', 'hero-2', 'texto-1']);
assert.deepEqual(blocks.removeBlock(b, 'hero-2').map((x) => x.id), ['hero-1', 'texto-1']);
assert.equal(blocks.setBlockField(b, 'hero-1', 'subtitulo', 'Olá').find((x) => x.id === 'hero-1').subtitulo, 'Olá');
assert.equal('subtitulo' in blocks.setBlockField(blocks.setBlockField(b, 'hero-1', 'subtitulo', 'Olá'), 'hero-1', 'subtitulo', '').find((x) => x.id === 'hero-1'), false);
assert.equal(blocks.setBlockField(blocks.addBlock([], 'produtos_destaque'), 'produtos-destaque-1', 'quantidade', '12', 'number')[0].quantidade, 12);
assert.equal(b[0].subtitulo, undefined); // não altera a lista original
assert.equal(blocks.validatePageSlug('sobre', {}), null); assert.equal(blocks.validatePageSlug('Sobre', {}), null);
assert.equal(blocks.validatePageSlug('carrinho', {}), 'err_page_reserved'); assert.equal(blocks.validatePageSlug('sobre', { sobre: {} }), 'err_page_exists');
for (const bad of ['', 'a b', '-x', 'x-', 'ação', 'a'.repeat(41)]) assert.equal(blocks.validatePageSlug(bad, {}), 'err_page_slug', bad);
assert.deepEqual(blocks.addPage({}, ' Sobre ', ' Quem somos '), { sobre: { titulo: 'Quem somos', blocos: [] } });
assert.deepEqual(blocks.removePage({ a: { titulo: 'A', blocos: [] }, b: { titulo: 'B', blocos: [] } }, 'a'), { b: { titulo: 'B', blocos: [] } });
console.log('check-store-panel: ok');
