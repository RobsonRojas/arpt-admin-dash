import { describe, expect, it } from 'vitest';
import { batchResultText, canConfirmShipped, canReopenPayout, daysShippedText, debitTypeLabel, holdReasonLabel, payoutStatusColor, payoutStatusLabel, shippedAttention, statusColor, statusLabel, trackingStatusLabel } from './orders';

/** harden-payout-transfers-and-chargebacks: os estados e motivos novos têm texto próprio, e só o repasse que falhou pode ser reaberto. */
describe('repasse que falhou', () => {
    it('só FALHA pode ser reaberto', () => {
        expect(canReopenPayout({ status: 'FALHA' })).toBe(true);
        for (const status of ['PENDENTE', 'RETIDO', 'EM_TRANSFERENCIA', 'LIBERADO', 'CANCELADO']) expect(canReopenPayout({ status })).toBe(false);
        expect(canReopenPayout(null)).toBe(false);
        expect(canReopenPayout(undefined)).toBe(false);
    });

    it('os estados novos têm rótulo e cor (nunca o código cru)', () => {
        expect(payoutStatusLabel('FALHA')).toBe('Falhou');
        expect(payoutStatusLabel('EM_TRANSFERENCIA')).toBe('Em transferência');
        expect(payoutStatusColor('FALHA')).toBe('error');
        expect(payoutStatusColor('LIBERADO')).toBe('success');
        expect(payoutStatusColor('RETIDO')).toBe('warning');
        expect(payoutStatusColor('PENDENTE')).toBe('default');
    });

    it('motivos de retenção e tipos de débito novos legíveis', () => {
        expect(holdReasonLabel('CONTESTACAO')).toMatch(/contestado/);
        expect(holdReasonLabel('MARGEM_NEGATIVA')).toMatch(/Margem negativa/);
        expect(debitTypeLabel('CONTESTACAO')).toMatch(/contestado/);
        expect(debitTypeLabel('REEMBOLSO_EXTERNO')).toMatch(/fora do sistema/);
        expect(debitTypeLabel('OUTRO')).toBe('OUTRO'); // desconhecido não some
    });
});

/** automate-delivery-confirmation-and-lost-shipments: lista de enviados sem confirmação e confirmação em lote. */
describe('enviados sem confirmação', () => {
    it('só o ENVIADO entra no lote; o extraviado tem decisão própria', () => {
        expect(canConfirmShipped({ status: 'ENVIADO' })).toBe(true);
        for (const status of ['EXTRAVIADO', 'ENTREGUE', 'CANCELADO', 'PRONTO']) expect(canConfirmShipped({ status })).toBe(false);
        expect(canConfirmShipped(null)).toBe(false);
    });

    it('o que chama a atenção, do mais grave ao menos', () => {
        expect(shippedAttention({ status: 'EXTRAVIADO', rastreio_status: 'PROBLEMA' }).level).toBe('error');
        expect(shippedAttention({ status: 'ENVIADO', rastreio_status: 'DESTINO_DIVERGENTE', alerta_envio_atrasado_em: 'x' }).text).toMatch(/outro CEP/);
        expect(shippedAttention({ status: 'ENVIADO', rastreio_status: 'PROBLEMA' }).level).toBe('warning');
        expect(shippedAttention({ status: 'ENVIADO', alerta_envio_atrasado_em: '2026-11-01T00:00:00Z' }).text).toMatch(/muito tempo/);
        expect(shippedAttention({ status: 'ENVIADO', rastreio_status: 'EM_TRANSITO' })).toBeNull();
        expect(shippedAttention(null)).toBeNull();
    });

    it('rótulos: extraviado e os estados do rastreio (sem consulta automática quando vazio; desconhecido não some)', () => {
        expect(statusLabel('EXTRAVIADO')).toBe('Extraviado');
        expect(statusColor('EXTRAVIADO')).toBe('error');
        expect(trackingStatusLabel(null)).toBe('Sem consulta automática');
        expect(trackingStatusLabel('DESTINO_DIVERGENTE')).toMatch(/diferente/);
        expect(trackingStatusLabel('OUTRO')).toBe('OUTRO');
    });

    it('há quantos dias', () => {
        expect(daysShippedText(0)).toBe('hoje');
        expect(daysShippedText(1)).toBe('há 1 dia');
        expect(daysShippedText(16)).toBe('há 16 dias');
        expect(daysShippedText(null)).toBe('—');
    });

    it('resumo do lote: contagem das confirmadas e o motivo de cada recusa', () => {
        expect(batchResultText([{ id: 1, resultado: 'ENTREGUE' }])).toEqual({ text: '1 entrega confirmada.', ok: 1, recusados: 0 });
        const r = batchResultText([{ id: 1, resultado: 'ENTREGUE' }, { id: 2, resultado: 'ENTREGUE' }, { id: 3, resultado: 'RECUSADO', motivo: 'já está entregue' }]);
        expect(r).toMatchObject({ ok: 2, recusados: 1 });
        expect(r.text).toBe('2 entregas confirmadas. 1 recusada: #3 (já está entregue).');
        expect(batchResultText(undefined)).toMatchObject({ ok: 0, recusados: 0 });
    });
});
