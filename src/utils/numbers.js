// Entrada numérica em formato brasileiro: vírgula decimal e ponto de milhar ("12,50", "1.250,00").
// Aceita também número sem separador ("1250", "12"). Ponto sem três dígitos depois ("12.5") é rejeitado,
// porque no formato brasileiro não há ponto decimal; o painel não pode adivinhar.

const FORMATO_BR = /^(\d{1,3}(\.\d{3})+|\d+)(,\d+)?$/;

/**
 * @returns {{ value: number } | { error: string }}
 */
export function parseBrNumber(texto, { min = 0, mensagemCampo = 'valor' } = {}) {
  const limpo = String(texto ?? '').trim();
  if (limpo === '') return { error: `Informe ${mensagemCampo}.` };
  if (!FORMATO_BR.test(limpo)) return { error: `Use número no formato 1.250,00 para ${mensagemCampo}.` };
  const value = Number(limpo.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(value)) return { error: `Use número válido para ${mensagemCampo}.` };
  if (value < min) return { error: `${capitalizar(mensagemCampo)} não pode ser menor que ${min}.` };
  return { value };
}

function capitalizar(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
