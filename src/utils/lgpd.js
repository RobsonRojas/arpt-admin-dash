// Anonimização de perfil (LGPD) exige confirmação em dois passos. O segundo passo é digitar a palavra abaixo,
// para que a ação não seja disparada por um clique acidental. Não é a regra de segurança: o backend recusa
// a anonimização com lojas ativas ou pedidos em aberto.
export const PALAVRA_ANONIMIZAR = 'ANONIMIZAR';

export function confirmacaoAnonimizacaoOk(texto) {
  return String(texto ?? '').trim() === PALAVRA_ANONIMIZAR;
}

// Nome do arquivo de exportação de um dropshipper.
export function nomeArquivoExportacao(userId, agora = new Date()) {
  const data = agora.toISOString().slice(0, 10);
  return `dropshipper-${userId}-${data}.json`;
}

// Evidência de consentimento para registro em nome do dropshipper: explica como o consentimento foi obtido.
export const EVIDENCIA_MIN = 20;
export const EVIDENCIA_MAX = 2000;

export function validarEvidencia(texto) {
  const limpo = String(texto ?? '').trim();
  if (limpo.length < EVIDENCIA_MIN) return { error: `A evidência precisa ter pelo menos ${EVIDENCIA_MIN} caracteres.` };
  if (limpo.length > EVIDENCIA_MAX) return { error: `A evidência pode ter no máximo ${EVIDENCIA_MAX} caracteres.` };
  return { value: limpo };
}

// Identificador de usuário: UUID, como na tabela de usuários.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function uuidValido(texto) {
  return UUID_RE.test(String(texto ?? '').trim());
}
