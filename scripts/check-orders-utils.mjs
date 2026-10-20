import assert from 'node:assert/strict';
import * as u from '../src/utils/orders.js';
assert.equal(u.statusLabel('PAGO'), 'Aguardando aceite');
assert.equal(u.statusLabel('XYZ'), 'XYZ');
assert.equal(u.statusLabel(null), '—');
assert.equal(u.statusColor('ENTREGUE'), 'success');
assert.equal(u.statusColor('?'), 'default');
// dinheiro
assert.match(u.money(1234.5), /1\.234,50/);
assert.equal(u.money(null), '—'); assert.equal(u.money(''), '—'); assert.equal(u.money('abc'), '—'); assert.equal(u.money(undefined), '—');
assert.match(u.money('310.00'), /310,00/);
assert.match(u.money(0), /0,00/);
// datas
assert.equal(u.dateTime(null), '—'); assert.equal(u.dateTime('ontem'), '—');
// prazos
const now = Date.parse('2026-11-10T12:00:00Z');
assert.equal(u.deadlineText('2026-11-12T15:00:00Z', now), '2 d 3 h');
assert.equal(u.deadlineText('2026-11-10T13:30:00Z', now), '1 h 30 min');
assert.equal(u.deadlineText('2026-11-09T08:00:00Z', now), 'atrasado há 1 d 4 h');
assert.equal(u.deadlineText(null, now), '—'); assert.equal(u.deadlineText('x', now), '—');
// margem: ignora cancelado/devolvido, soma exata em centavos
assert.equal(u.totalMargin([{ status: 'PAGO', margem: 0.1 }, { status: 'ENTREGUE', margem: 0.2 }, { status: 'CANCELADO', margem: 999 }, { status: 'DEVOLVIDO', margem: 50 }]), 0.3);
assert.equal(u.totalMargin([]), 0); assert.equal(u.totalMargin(undefined), 0);
// contagem por estado, na ordem do fluxo
assert.deepEqual(u.countByStatus([{ status: 'ENVIADO' }, { status: 'PAGO' }, { status: 'PAGO' }]).map((c) => [c.status, c.count]), [['PAGO', 2], ['ENVIADO', 1]]);
assert.deepEqual(u.countByStatus(null), []);
// cancelamento
assert.deepEqual(u.cancelHint('PAGO').direct, true);
assert.equal(u.cancelHint('EM_PRODUCAO').direct, false);
assert.equal(u.cancelHint('EM_PRODUCAO').allowed, true);
for (const s of ['ENVIADO', 'ENTREGUE', 'CANCELADO', 'DEVOLVIDO']) assert.equal(u.cancelHint(s).allowed, false);
assert.match(u.cancelResultMessage({ resultado: 'CANCELADO' }), /reembolso/);
assert.match(u.cancelResultMessage({ resultado: 'SOLICITADO' }), /administrador/);
assert.match(u.cancelResultMessage(null), /Não foi possível/);
// SLA: sem histórico é indisponível, não 0%
assert.equal(u.slaRate({ total: 0, taxa_no_prazo: null }), 'indisponível');
assert.equal(u.slaRate({ total: 4, taxa_no_prazo: 50 }), '50,0%');
assert.equal(u.slaRate({ total: 3, taxa_no_prazo: 0 }), '0,0%'); // zero real é diferente de indisponível
assert.equal(u.slaRate(undefined), 'indisponível');
assert.equal(u.slaDelay({ atraso_medio_dias: 2.5 }), '2,5 dias'); assert.equal(u.slaDelay({ atraso_medio_dias: null }), '—');
// repasses
assert.equal(u.payoutStatusLabel('RETIDO'), 'Retido');
assert.equal(u.holdReasonLabel('SEM_CONTA'), 'Sem conta de recebimento'); assert.equal(u.holdReasonLabel(null), ''); assert.equal(u.holdReasonLabel('OUTRO'), 'OUTRO');
assert.equal(u.beneficiaryLabel('ARPT'), 'ARPT');
// erros
assert.equal(u.apiError({ response: { data: { error: 'Prazo vencido' } } }), 'Prazo vencido');
assert.equal(u.apiError({}, 'padrão'), 'padrão');
console.log('orders.js: todas as verificações passaram');
