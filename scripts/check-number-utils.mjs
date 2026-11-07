import assert from 'node:assert/strict';
import { parseBrNumber } from '../src/utils/numbers.js';

// formato brasileiro
assert.deepEqual(parseBrNumber('12,50'), { value: 12.5 });
assert.deepEqual(parseBrNumber('1.250,00'), { value: 1250 });
assert.deepEqual(parseBrNumber('1.250.000,5'), { value: 1250000.5 });
assert.deepEqual(parseBrNumber('1250'), { value: 1250 });
assert.deepEqual(parseBrNumber(' 0 '), { value: 0 });

// nunca vira NaN nem nulo: entrada inválida devolve erro
assert.ok(parseBrNumber('').error);
assert.ok(parseBrNumber('   ').error);
assert.ok(parseBrNumber('12.5').error, 'ponto decimal não é aceito');
assert.ok(parseBrNumber('1,2,3').error);
assert.ok(parseBrNumber('abc').error);
assert.ok(parseBrNumber('12,').error);

// mínimo
assert.ok(parseBrNumber('-1').error);
assert.ok(parseBrNumber('-1', { min: -5 }).error, 'sinal de menos não é aceito em preço ou limite');
assert.ok(parseBrNumber('0,5', { min: 1 }).error, 'abaixo do mínimo é recusado');
assert.match(parseBrNumber('', { mensagemCampo: 'o preço' }).error, /preço/);

console.log('check-number-utils: ok');
