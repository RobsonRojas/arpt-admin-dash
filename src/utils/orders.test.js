import { describe, expect, it } from 'vitest';
import { canReopenPayout, debitTypeLabel, holdReasonLabel, payoutStatusColor, payoutStatusLabel } from './orders';

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
