// Rota do detalhe de um dropshipper a partir de uma linha da lista de lojas.
// O detalhe é indexado pelo id do DONO da loja (user_id), não pelo id da loja: o backend responde
// PROFILE_NOT_FOUND para o id de loja. Sem dono identificado, não há rota.
export function rotaDetalheDropshipper(loja) {
  const donoId = loja?.user_id;
  return donoId ? `/dropshipping-admin/${donoId}` : null;
}
