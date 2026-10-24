import assert from 'node:assert/strict';
import { validarMotivo, MOTIVO_MIN, MOTIVO_MAX } from '../src/utils/motivo.js';

// motivo válido é devolvido aparado
assert.deepEqual(validarMotivo('  Documento vencido  '), { value: 'Documento vencido' });
assert.deepEqual(validarMotivo('abc'), { value: 'abc' });

// vazio ou só espaços: nunca envia
assert.ok(validarMotivo('').error);
assert.ok(validarMotivo('     ').error);
assert.ok(validarMotivo(undefined).error);

// curto demais (mínimo de 3 após aparar)
assert.equal(MOTIVO_MIN, 3);
assert.ok(validarMotivo('ab').error);
assert.ok(validarMotivo(' a ').error);

// longo demais
assert.equal(MOTIVO_MAX, 500);
assert.ok(validarMotivo('x'.repeat(501)).error);
assert.deepEqual(validarMotivo('x'.repeat(500)), { value: 'x'.repeat(500) });

console.log('check-motivo-utils: ok');
