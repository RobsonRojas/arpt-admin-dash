import assert from 'node:assert/strict';
import { contagem, ESTADOS, idCurto, motivosOrdenados, resumoMotivos, rotuloMotivo, totalIndicacoes } from '../src/utils/referralReview.js';

// os quatro estados que o servidor devolve, cada um com rótulo e explicação
assert.deepEqual(ESTADOS.map((e) => e[0]), ['nao_qualificada', 'qualificada', 'bloqueada', 'expirada']);
assert.ok(ESTADOS.every((e) => e[1] && e[2]));

// motivos conhecidos têm rótulo; um motivo novo do servidor aparece como veio
assert.equal(rotuloMotivo('cpf_igual'), 'CPF igual ao do indicador');
assert.equal(rotuloMotivo('motivo_novo'), 'motivo_novo');
assert.equal(rotuloMotivo('sem_motivo'), 'Sem motivo registrado');

// contagem: nunca NaN
assert.equal(contagem('3'), 3);
assert.equal(contagem(undefined), 0);
assert.equal(contagem('abc'), 0);
assert.equal(contagem(null), 0);

// total
assert.equal(totalIndicacoes({ nao_qualificada: 1, qualificada: 2, bloqueada: '3', expirada: 0 }), 6);
assert.equal(totalIndicacoes(undefined), 0);
assert.equal(totalIndicacoes({}), 0);

// ordem: mais frequente primeiro; empate pelo rótulo
assert.deepEqual(
  motivosOrdenados({ dispositivo_igual: 1, cpf_igual: 3, auto_indicacao: 1 }).map((m) => [m.motivo, m.n]),
  [['cpf_igual', 3], ['auto_indicacao', 1], ['dispositivo_igual', 1]],
);
assert.deepEqual(motivosOrdenados(undefined), []);
assert.equal(resumoMotivos({ cpf_igual: 2, dispositivo_igual: 1 }), 'CPF igual ao do indicador: 2 · Dispositivo igual ao do indicador: 1');
assert.equal(resumoMotivos({}), '');

// identificador curto
assert.equal(idCurto('681b7c26-b1a7-471b-87f5-112d9779f0d3'), '681b7c26…');
assert.equal(idCurto('abc'), 'abc');
assert.equal(idCurto(undefined), '');

console.log('check-referral-review: ok');
