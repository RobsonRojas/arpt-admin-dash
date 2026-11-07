/**
 * Provedores de DNS do guia do domínio próprio (spec store-domain-dns-guide). São DADOS: o componente só os lê. Para incluir um provedor,
 * acrescente um item aqui e as chaves `dnsg_prov_<id>` (e `dnsg_prov_<id>_nota`, se tiver nota) em `i18n.js`, em pt e en.
 *
 * Cada campo só afirma o que é estável e conhecido; o resto fica no texto geral, que vale para todos. As telas dos provedores mudam, então
 * NÃO há caminhos de menu aqui: só o que preencher em cada campo.
 *
 * - `nomeRaiz`: como se escreve a raiz no campo de nome (`'@'`, `'vazio'` para deixar em branco, ou `null` quando varia/não foi conferido).
 * - `txtAspas`: o provedor exige o valor do TXT entre aspas duplas.
 * - `proxy`: o provedor tem proxy que precisa ficar desligado para a verificação e o certificado funcionarem.
 * - `raizAlias`: `'flattening'` (aceita CNAME na raiz por "flattening"), `'so-aws'` (o ALIAS só aponta para recursos do próprio provedor, então a
 *   raiz usa A) ou `null` (varia).
 * - `conferido`: data (AAAA-MM-DD) em que alguém conferiu a orientação numa conta real do provedor; `null` = ainda não conferido, e o painel
 *   mostra que a orientação é geral (tarefa 4.1 da change add-store-domain-dns-guide).
 */
export const DNS_PROVIDERS = [
  { id: 'registro_br', nomeRaiz: null, txtAspas: false, proxy: false, raizAlias: null, conferido: null },
  { id: 'hostinger', nomeRaiz: null, txtAspas: false, proxy: false, raizAlias: null, conferido: null },
  { id: 'godaddy', nomeRaiz: '@', txtAspas: false, proxy: false, raizAlias: null, conferido: null },
  { id: 'locaweb', nomeRaiz: null, txtAspas: false, proxy: false, raizAlias: null, conferido: null },
  { id: 'cloudflare', nomeRaiz: '@', txtAspas: false, proxy: true, raizAlias: 'flattening', conferido: null },
  { id: 'route53', nomeRaiz: 'vazio', txtAspas: true, proxy: false, raizAlias: 'so-aws', conferido: null },
  { id: 'namecheap', nomeRaiz: '@', txtAspas: false, proxy: false, raizAlias: null, conferido: null },
  { id: 'google', nomeRaiz: null, txtAspas: false, proxy: false, raizAlias: null, conferido: null },
  { id: 'outro', nomeRaiz: null, txtAspas: false, proxy: false, raizAlias: null, conferido: null },
];

/** Provedores que a spec exige no mínimo, além de "outro". */
export const PROVEDORES_OBRIGATORIOS = ['registro_br', 'hostinger', 'godaddy', 'locaweb', 'cloudflare', 'route53', 'namecheap', 'google', 'outro'];

export const providerById = (id) => DNS_PROVIDERS.find((p) => p.id === id) ?? DNS_PROVIDERS[DNS_PROVIDERS.length - 1];

/** Parte do domínio antes da zona (`loja` em `loja.exemplo.com.br` com zona `exemplo.com.br`); vazio na raiz. */
export function nomeRelativoDoDominio(dominio, zona) {
  if (!dominio || !zona || dominio === zona) return '';
  return dominio.endsWith(`.${zona}`) ? dominio.slice(0, -(zona.length + 1)) : '';
}
