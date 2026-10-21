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
console.log('check-shipping-utils: ok');
