import assert from 'node:assert/strict';
import * as s from '../src/utils/shipping.js';
// CEP
assert.equal(s.normalizeCep('69000-000'), '69000000'); assert.equal(s.normalizeCep(' 69.000-000 '), '69000000'); assert.equal(s.normalizeCep('69000000'), '69000000');
for (const bad of ['', '123', '6900000', '690000000', 'abcdefgh', '69000-00x', null, undefined, 69000000]) assert.equal(s.normalizeCep(bad), null);
// payload: em branco e 0 viram 0 (não informado)
assert.deepEqual(s.buildShippingPayload({}).payload, { weight_grams: 0, width_cm: 0, height_cm: 0, length_cm: 0, cep_origem: null });
assert.deepEqual(s.buildShippingPayload({ weight_grams: '', width_cm: '0', height_cm: 0, length_cm: null, cep_origem: '' }).payload, { weight_grams: 0, width_cm: 0, height_cm: 0, length_cm: 0, cep_origem: null });
// valores válidos, como texto do campo ou número
assert.deepEqual(s.buildShippingPayload({ weight_grams: '2500', width_cm: 30, height_cm: '12', length_cm: 60, cep_origem: '01310-100' }).payload, { weight_grams: 2500, width_cm: 30, height_cm: 12, length_cm: 60, cep_origem: '01310100' });
// limites inclusivos
assert.equal(s.buildShippingPayload({ weight_grams: s.MAX_WEIGHT_GRAMS }).error, undefined);
assert.equal(s.buildShippingPayload({ length_cm: s.MAX_DIMENSION_CM }).error, undefined);
assert.match(s.buildShippingPayload({ weight_grams: s.MAX_WEIGHT_GRAMS + 1 }).error, /Peso.*máximo/);
assert.match(s.buildShippingPayload({ width_cm: s.MAX_DIMENSION_CM + 1 }).error, /Largura/);
// decimal, negativo, texto e NaN são recusados com a mensagem do campo certo
assert.match(s.buildShippingPayload({ weight_grams: '1.5' }).error, /Peso.*inteiro/);
assert.match(s.buildShippingPayload({ height_cm: '-3' }).error, /Altura.*inteiro/);
assert.match(s.buildShippingPayload({ length_cm: 'abc' }).error, /Profundidade/);
assert.ok(s.buildShippingPayload({ width_cm: NaN }).error);
assert.match(s.buildShippingPayload({ cep_origem: '12' }).error, /CEP de origem/);
// o primeiro erro vence e nenhum payload é devolvido junto
const r = s.buildShippingPayload({ weight_grams: '1.5', cep_origem: '12' }); assert.ok(r.error); assert.equal(r.payload, undefined);
// o que falta para vender com frete
assert.deepEqual(s.missingShippingLabels({ weight_grams: 1, width_cm: 1, height_cm: 1, length_cm: 1, cep_origem: '69000000' }), []);
assert.deepEqual(s.missingShippingLabels({}), ['Peso (g)', 'Largura (cm)', 'Altura (cm)', 'Profundidade (cm)', 'CEP de origem']);
assert.deepEqual(s.missingShippingLabels({ weight_grams: 0, width_cm: 5, height_cm: 5, length_cm: 5 }, true), ['Peso (g)']); // origem vem do padrão do ambiente
assert.deepEqual(s.missingShippingLabels(null), ['Peso (g)', 'Largura (cm)', 'Altura (cm)', 'Profundidade (cm)', 'CEP de origem']);
// ── acompanhamento do administrador (4.1)
assert.deepEqual(s.pendingLabels(['weight_grams', 'cep_origem']), ['Peso', 'CEP de origem']);
assert.deepEqual(s.pendingLabels(['width_cm', 'xpto', 7, null, '__proto__', 'toString']), ['Largura']); // chave desconhecida e do protótipo ignoradas
for (const bad of [null, undefined, 'weight_grams', 5, {}]) assert.deepEqual(s.pendingLabels(bad), []);
const P = (o) => ({ id: 1, is_ativo: true, dados_de_frete_pendentes: [], ...o });
assert.equal(s.hasPendingShipping(P({ dados_de_frete_pendentes: ['weight_grams'] })), true);
assert.equal(s.hasPendingShipping(P({})), false);
assert.equal(s.hasPendingShipping(P({ is_ativo: false, dados_de_frete_pendentes: ['weight_grams'] })), false); // inativo não conta
assert.equal(s.hasPendingShipping(P({ dados_de_frete_pendentes: ['xpto'] })), false); assert.equal(s.hasPendingShipping(null), false);
const lista = [P({ id: 1 }), P({ id: 2, dados_de_frete_pendentes: ['length_cm'] }), P({ id: 3, is_ativo: false, dados_de_frete_pendentes: ['length_cm'] })];
assert.deepEqual(s.filterProducts(lista).map((x) => x.id), [1, 2, 3]); assert.deepEqual(s.filterProducts(lista, { onlyPending: true }).map((x) => x.id), [2]);
assert.equal(lista.length, 3); assert.deepEqual(s.filterProducts(null), []); assert.equal(s.countPending(lista), 1); assert.equal(s.countPending(undefined), 0);
assert.equal(s.reminderSummaryText({ produtores_com_pendencia: 0 }), 'Nenhum produtor com produto ativo sem dados de frete.');
assert.equal(s.reminderSummaryText({ simulado: true, produtores_com_pendencia: 3, avisados: 2, emails: 2, pushes: 1, ignorados_ja_avisados: 1, sem_canal: 0 }), 'Simulação: 2 de 3 produtor(es) seriam avisados · e-mails: 2 · push: 1 · 1 já avisado(s) recentemente.');
assert.equal(s.reminderSummaryText({ simulado: false, produtores_com_pendencia: 2, avisados: 1, emails: 1, pushes: 0, sem_canal: 1 }), '1 de 2 produtor(es) avisados · e-mails: 1 · push: 0 · 1 sem e-mail nem dispositivo.');
assert.equal(s.reminderSummaryText(null), 'Resposta inesperada do servidor.'); assert.match(s.reminderSummaryText({ produtores_com_pendencia: 'x' }), /Nenhum produtor/);
console.log('check-shipping-utils: ok');
