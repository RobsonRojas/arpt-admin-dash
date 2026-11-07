// Motivo obrigatório de recusa, suspensão e reativação. Mesma regra do backend (reasonSchema):
// texto aparado com 3 a 500 caracteres. O painel não envia a ação sem motivo válido.
export const MOTIVO_MIN = 3;
export const MOTIVO_MAX = 500;

/**
 * @returns {{ value: string } | { error: string }}
 */
export function validarMotivo(texto) {
  const limpo = String(texto ?? '').trim();
  if (limpo.length === 0) return { error: 'Informe o motivo.' };
  if (limpo.length < MOTIVO_MIN) return { error: `O motivo precisa ter pelo menos ${MOTIVO_MIN} caracteres.` };
  if (limpo.length > MOTIVO_MAX) return { error: `O motivo pode ter no máximo ${MOTIVO_MAX} caracteres.` };
  return { value: limpo };
}
