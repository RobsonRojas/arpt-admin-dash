import assert from 'node:assert/strict';
import { confirmacaoAnonimizacaoOk, nomeArquivoExportacao, PALAVRA_ANONIMIZAR } from '../src/utils/lgpd.js';

// a confirmação em dois passos só passa com a palavra exata (ignora espaços nas bordas)
assert.equal(PALAVRA_ANONIMIZAR, 'ANONIMIZAR');
assert.ok(confirmacaoAnonimizacaoOk('ANONIMIZAR'));
assert.ok(confirmacaoAnonimizacaoOk('  ANONIMIZAR  '));
assert.ok(!confirmacaoAnonimizacaoOk('anonimizar'));
assert.ok(!confirmacaoAnonimizacaoOk(''));
assert.ok(!confirmacaoAnonimizacaoOk(undefined));
assert.ok(!confirmacaoAnonimizacaoOk('ANONIMIZA'));

// nome do arquivo de exportação inclui o dropshipper e a data
assert.equal(nomeArquivoExportacao('user-1', new Date('2026-10-24T12:00:00Z')), 'dropshipper-user-1-2026-10-24.json');

console.log('check-lgpd-utils: ok');

import { validarEvidencia, uuidValido } from '../src/utils/lgpd.js';
assert.ok(validarEvidencia('curta').error);
assert.ok(validarEvidencia('x'.repeat(2001)).error);
assert.deepEqual(validarEvidencia('  Termo assinado em papel e recebido por e-mail.  '), { value: 'Termo assinado em papel e recebido por e-mail.' });
assert.ok(uuidValido('2654f6f3-079f-4f6a-92ff-d18de1757825'));
assert.ok(!uuidValido('user-f00cf69f'));
assert.ok(!uuidValido(''));
console.log('check-lgpd-utils: evidência e UUID ok');
