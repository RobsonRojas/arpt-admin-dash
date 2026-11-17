// Corpo e mensagens da transferência administrativa de lojas e de produtos (add-transfer-dropshipper-store-and-producer-products).
import { validarMotivo } from './motivo';

/**
 * @param {'lojas'|'produtos'} modo
 * @param {{ destinoId?: string, motivo: string, itemIds?: number[]|null, extra?: { antigoComo?: string, manterAlternativa?: boolean }, simular: boolean }} p
 * @returns {{ body: object } | { error: string }}
 */
export function montarCorpoTransferencia(modo, { destinoId, motivo, itemIds, extra = {}, simular }) {
  if (!destinoId) return { error: 'Escolha o destino da transferência.' };
  const m = validarMotivo(motivo);
  if (m.error) return { error: m.error };
  const body = { destino_user_id: destinoId, motivo: m.value, simular };
  if (modo === 'lojas') {
    if (itemIds?.length) body.loja_ids = itemIds;
    if (extra.antigoComo) body.manter_antigo_como = extra.antigoComo;
  } else {
    if (itemIds?.length) body.produto_ids = itemIds;
    if (extra.manterAlternativa) body.manter_origem_como_alternativa = true;
  }
  return { body };
}

export const mensagemErroTransferencia = (err) =>
  err?.response?.data?.error || err?.message || 'Não foi possível concluir a transferência.';
