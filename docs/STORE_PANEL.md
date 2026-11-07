# Painel da loja do dropshipper (`/loja`)

Módulo `src/modules/store-panel`, dentro do `arpt-admin-dash` (Vite + MUI). Rotas: `/loja` (abre a primeira loja do usuário) e
`/loja/:storeId/:secao`. Menu "Minha loja" no layout.

## Seções e papéis

| Seção | Dono | Editor | Financeiro |
|---|---|---|---|
| Visão geral (status, checklist, publicar/pausar, pré-visualização) | edita | edita (publica a configuração; só o dono ativa/pausa a loja) | lê |
| Produtos e margens | edita (preço de venda) | edita | lê |
| Pedidos e financeiro (`StoreOrdersTab`: pedidos, repasses, SLA) | edita | — | lê |
| Aparência (logo, imagens, cores, fonte, estilos, template) | edita | edita | — |
| Páginas (home e páginas; blocos hero, texto, produtos em destaque, imagem, contato, newsletter) | edita | edita | — |
| Domínio (cadastro, instruções de DNS, verificação, TLS) | edita | — | — |
| Marketing e SEO (GTM, GA4, Pixel, verificação Google, aviso de cookies, SEO padrão) | edita | edita | — |
| Equipe (membros, convites, papéis) | edita | — | — |
| Configurações (nome, rodapé, dados do negócio) | edita | — | — |

`permissions.js` só decide o que aparece; a API é quem autoriza (loja alheia = 404, papel sem permissão = 403).
Edições vão para o **rascunho** da vitrine; o visitante só vê ao publicar (Visão geral).

## Checklist de publicação

Obrigatórios (bloqueiam o botão): produto ativo alocado, logo, dados do negócio (razão social + e-mail ou telefone).
Só informam: dados de frete dos produtos, domínio próprio com TLS ativo. O servidor continua sendo a trava final
(`NO_ACTIVE_PRODUCTS`, validação do rascunho).

## Idiomas do painel (pt/en)

`i18n.js` tem os dicionários; `LangContext.jsx` guarda a escolha **por usuário neste navegador** (padrão: português; o idioma do
navegador não decide). Erros da API são traduzidos pelo `code` (`errors.js`). `npm run check:utils` (`scripts/check-store-panel.mjs`)
falha se faltar uma chave em um dos idiomas, se o código usar chave inexistente, se faltar o texto de um código de erro conhecido
ou se mudarem as regras de permissão, validação e checklist.

## Testes

- `npm run check:utils` — regras puras (idiomas, permissões, validação, checklist, blocos).
- `scripts/test-e2e-local.sh panel` (na raiz do repositório, tudo em Docker) — `frontend/manejo-app/e2e/tests/panel.spec.ts`:
  painel em modo dev contra a API real. O desvio de login (`VITE_SKIP_AUTH=true`) existe **só** no compose do E2E; o painel então envia
  o token guardado em `localStorage.arpt_e2e_token` (Keycloak falso). Nunca ligue `VITE_SKIP_AUTH` em produção.

Variáveis do painel: `VITE_STOREFRONT_BASE_DOMAIN` (padrão `arpt.site`) e `VITE_STOREFRONT_LOCAL_URL` (dev: usa `/store/<slug>`).
Só para o E2E: `VITE_NO_SSL`, `VITE_ALLOWED_HOSTS`, `VITE_CACHE_DIR`.
