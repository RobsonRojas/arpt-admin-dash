import assert from 'node:assert/strict';
import * as t from '../src/utils/terms.js';
assert.deepEqual(t.AUDIENCES, ['GERAL', 'PRODUTOR', 'DROPSHIPPER']);
assert.match(t.audienceLabel('PRODUTOR'), /Manejar/); assert.match(t.audienceLabel('DROPSHIPPER'), /manejo-app/); assert.equal(t.audienceLabel('X'), 'X');
const terms = [
    { id: 1, audience: 'GERAL', status: 'published', published_at: '2026-01-01T00:00:00Z' },
    { id: 2, status: 'published', published_at: '2026-02-01T00:00:00Z' }, // sem público: conta como GERAL
    { id: 3, audience: 'PRODUTOR', status: 'draft' },
    { id: 4, audience: 'PRODUTOR', status: 'published', published_at: '2026-03-01T00:00:00Z' },
    { id: 5, audience: 'PRODUTOR', status: 'published', published_at: '2026-04-01T00:00:00Z' },
];
assert.deepEqual(t.termsOf(terms, 'GERAL').map((x) => x.id), [1, 2]);
assert.equal(t.currentTerm(terms, 'GERAL').id, 2);
assert.equal(t.currentTerm(terms, 'PRODUTOR').id, 5, 'o vigente é o publicado mais recente, não o rascunho');
assert.equal(t.currentTerm(terms, 'DROPSHIPPER'), null); assert.equal(t.currentTerm(null, 'GERAL'), null);
// rascunho: inglês vazio vira null; marca como booleano; based_on só quando há
assert.deepEqual(t.draftPayload({ content: 'pt', contentEn: '  ', audience: 'PRODUTOR', clauseFreight: undefined }), { content_md: 'pt', audience: 'PRODUTOR', content_md_en: null, contem_clausula_frete: false });
assert.deepEqual(t.draftPayload({ content: 'pt', contentEn: 'en', audience: 'DROPSHIPPER', clauseFreight: true, basedOnId: 7 }), { content_md: 'pt', audience: 'DROPSHIPPER', content_md_en: 'en', contem_clausula_frete: true, based_on_id: 7 });
// publicar: a marca do frete exige o inglês
assert.deepEqual(t.publishBlockers({ content_md: 'pt', contem_clausula_frete: false }), []);
assert.equal(t.publishBlockers({ content_md: 'pt', contem_clausula_frete: true, content_md_en: ' ' }).length, 1);
assert.deepEqual(t.publishBlockers({ content_md: 'pt', contem_clausula_frete: true, content_md_en: 'en' }), []);
assert.equal(t.publishBlockers({ content_md: ' ' }).length, 1); assert.equal(t.publishBlockers(null).length, 1);
assert.match(t.publishWarning({ audience: 'PRODUTOR', contem_clausula_frete: true }), /produtores.*cláusula do frete/s);
assert.match(t.publishWarning({ audience: 'DROPSHIPPER' }), /dropshippers/); assert.doesNotMatch(t.publishWarning({ audience: 'GERAL' }), /produtores|dropshippers|frete/);
// pendentes
assert.equal(t.pendingName({ nome_comercial: 'Loja X', email: 'a@b' }), 'Loja X');
assert.equal(t.pendingName({ first_name: 'Ana', last_name: 'Lima', email: 'a@b' }), 'Ana Lima');
assert.equal(t.pendingName({ first_name: '', last_name: null, email: 'a@b' }), 'a@b');
assert.equal(t.pendingName({ user_id: 'u1' }), 'u1'); assert.equal(t.pendingName(null), '—');
console.log('check-terms-utils: ok');
