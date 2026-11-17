import { describe, expect, it } from 'vitest';
import { montarCorpoTransferencia, mensagemErroTransferencia } from './transfer';

describe('corpo da transferência', () => {
  it('exige destino e motivo válidos', () => {
    expect(montarCorpoTransferencia('lojas', { motivo: 'ok ok', simular: true }).error).toMatch(/destino/i);
    expect(montarCorpoTransferencia('lojas', { destinoId: 'u1', motivo: ' ', simular: true }).error).toMatch(/motivo/i);
  });

  it('lojas: envia loja_ids só quando há seleção e o destino do dono anterior', () => {
    expect(montarCorpoTransferencia('lojas', { destinoId: 'u1', motivo: ' Venda ', itemIds: [3], extra: { antigoComo: 'remover' }, simular: false }).body)
      .toEqual({ destino_user_id: 'u1', motivo: 'Venda', simular: false, loja_ids: [3], manter_antigo_como: 'remover' });
    expect(montarCorpoTransferencia('lojas', { destinoId: 'u1', motivo: 'Venda', itemIds: [], simular: true }).body).not.toHaveProperty('loja_ids');
  });

  it('produtos: envia produto_ids e a opção de alternativa só quando marcada', () => {
    const r = montarCorpoTransferencia('produtos', { destinoId: 'p2', motivo: 'Troca', itemIds: [1, 2], extra: { manterAlternativa: true }, simular: true });
    expect(r.body).toEqual({ destino_user_id: 'p2', motivo: 'Troca', simular: true, produto_ids: [1, 2], manter_origem_como_alternativa: true });
    expect(montarCorpoTransferencia('produtos', { destinoId: 'p2', motivo: 'Troca', simular: true }).body).not.toHaveProperty('manter_origem_como_alternativa');
  });

  it('mensagem do erro da API', () => {
    expect(mensagemErroTransferencia({ response: { data: { error: 'O destino ultrapassaria o limite.' } } })).toBe('O destino ultrapassaria o limite.');
  });
});
