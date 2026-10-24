import assert from 'node:assert/strict';
import { rotaDetalheDropshipper } from '../src/utils/dropshipper.js';

// o detalhe usa o id do dono, nunca o id da loja
assert.equal(rotaDetalheDropshipper({ id: 77, user_id: 'user-abc' }), '/dropshipping-admin/user-abc');
assert.notEqual(rotaDetalheDropshipper({ id: 77, user_id: 'user-abc' }), '/dropshipping-admin/77');

// sem dono identificado não há rota
assert.equal(rotaDetalheDropshipper({ id: 77 }), null);
assert.equal(rotaDetalheDropshipper(null), null);

console.log('check-dropshipper-utils: ok');
