// Mensagens da API traduzidas pelo `code` do erro (a API devolve `{ error, code }`). Sem `code` conhecido, cai na mensagem
// genérica do idioma: nunca mostra o texto cru do servidor (que está em um idioma só).
export const KNOWN_CODES = [
  'STORE_NOT_FOUND', 'STORE_SUSPENDED', 'STORE_LIMIT_REACHED', 'NO_ACTIVE_PRODUCTS', 'SLUG_TAKEN', 'INVALID_SLUG', 'INVALID_STATE',
  'VALIDATION_ERROR', 'INVALID_CONFIG', 'INVALID_TEMPLATE', 'TEMPLATE_NOT_FOUND', 'VERSION_NOT_FOUND', 'PRICE_BELOW_MINIMUM',
  'ALREADY_ALLOCATED', 'ALREADY_MEMBER', 'INVITE_CONFLICT', 'INVITE_LIMIT_REACHED', 'OWNER_IMMUTABLE', 'MEMBER_NOT_FOUND',
  'UNAUTHORIZED', 'INVALID_DOMAIN', 'RESERVED_DOMAIN', 'DOMAIN_NOT_FOUND', 'DOMAIN_IN_USE', 'DOMAIN_LIMIT', 'VERIFY_TOO_SOON', 'FORBIDDEN', 'RATE_LIMIT',
  'INSUFFICIENT_ROLE', 'TERMS_OUTDATED', 'DROPSHIPPER_NOT_APPROVED', 'DROPSHIPPER_SUSPENDED', 'NOT_A_DROPSHIPPER', 'ALLOCATION_NOT_FOUND', 'PRODUCT_NOT_FOUND',
  'PRODUCT_INACTIVE', 'PRODUCER_CONFLICT', 'INVITE_NOT_FOUND', 'INVITE_EXPIRED', 'EMAIL_MISMATCH', 'EMAIL_NOT_VERIFIED',
  'NOTHING_TO_UNDO', 'DRAFT_CHANGED',
  'AI_UNAVAILABLE', 'AI_LIMIT_REACHED', 'AI_PROVIDER_FAILED', 'AI_PROPOSAL_INVALID', 'AI_PROPOSAL_NOT_FOUND',
];

/** Chave de i18n (`api_<CODE>`) para o erro de uma resposta; `api_GENERIC` se o código não for conhecido. */
export function errorKey(err) {
  const status = err?.response?.status;
  const code = err?.response?.data?.code;
  if (typeof code === 'string' && KNOWN_CODES.includes(code)) return `api_${code}`;
  if (status === 404) return 'api_STORE_NOT_FOUND';
  if (status === 401) return 'api_UNAUTHORIZED';
  if (status === 403) return 'api_FORBIDDEN';
  if (status === 429) return 'api_RATE_LIMIT';
  return 'api_GENERIC';
}
/** Erros de validação por campo que a API devolve em `detalhes: [{ campo, mensagem }]`. */
export const fieldErrors = (err) => Object.fromEntries((err?.response?.data?.detalhes ?? []).filter((d) => d?.campo).map((d) => [d.campo, d.mensagem]));
