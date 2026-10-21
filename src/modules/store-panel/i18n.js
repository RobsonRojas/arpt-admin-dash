// Idiomas do painel da loja: português e inglês. Dicionários por módulo e `translate(lang, chave, params)`; sem biblioteca.
// `scripts/check-store-panel.mjs` (parte de `npm run check:utils`) falha se uma chave existir só em um idioma, se o código
// usar uma chave que não existe, ou se faltar o texto de algum código de erro conhecido da API.
export const LANGS = ['pt', 'en'];
export const DEFAULT_LANG = 'pt';

const pt = {
  language: 'Idioma', save: 'Salvar', saved: 'Salvo.', saved_draft: 'Salvo no rascunho. Publique para o visitante ver.', remove: 'Remover', resend: 'Reenviar',
  status: 'Situação', active: 'Ativo', inactive: 'Inativo', paused: 'Pausado', default: 'Padrão', optional: 'opcional', read_only: 'Você só pode visualizar esta seção.',
  email: 'E-mail', phone: 'Telefone', address: 'Endereço', role: 'Papel',
  role_dono: 'Dono', role_editor: 'Editor', role_financeiro: 'Financeiro',
  not_found_title: 'Loja não encontrada', not_found_text: 'Esta loja não existe ou você não tem acesso a ela.', no_stores: 'Você ainda não tem uma loja.', create_store: 'Criar loja',
  menu_overview: 'Visão geral', menu_products: 'Produtos e margens', menu_orders: 'Pedidos e financeiro', menu_appearance: 'Aparência', menu_pages: 'Páginas',
  menu_domain: 'Domínio', menu_marketing: 'Marketing e SEO', menu_team: 'Equipe', menu_settings: 'Configurações',
  status_active: 'Publicada', status_paused: 'Pausada', status_draft: 'Rascunho', status_suspended: 'Suspensa',
  has_changes: 'Alterações não publicadas', no_changes: 'Tudo publicado', version: 'Versão {n}', open_store: 'Abrir a loja',
  checklist: 'Antes de publicar', check_product: 'Ao menos um produto ativo', check_shipping: 'Dados de frete dos produtos', check_logo: 'Logo da loja',
  check_business: 'Dados do negócio (razão social e um contato)', check_domain: 'Domínio próprio com TLS ativo',
  publish: 'Publicar', pause: 'Pausar loja', preview: 'Pré-visualizar', missing: 'Falta: {items}.', owner_activates: 'Só o dono ativa a loja.',
  published_ok: 'Loja publicada.', paused_ok: 'Loja pausada.',
  preview_live: 'Ver a loja com o rascunho', preview_live_hint: 'Abre a loja com o rascunho, só para você, por 15 minutos. Visitantes continuam vendo a versão publicada.',
  preview_home: 'Página inicial', preview_note: 'Resumo do rascunho (a loja real só muda ao publicar).',
  block_hero: 'Destaque', block_produtos_destaque: 'Produtos em destaque', block_texto: 'Texto', block_imagem: 'Imagem', block_faq: 'Perguntas frequentes',
  block_depoimentos: 'Depoimentos', block_newsletter: 'Newsletter', block_contato: 'Contato',
  product: 'Produto', sale_price: 'Preço de venda', min_price: 'Preço mínimo', no_products: 'Nenhum produto alocado a esta loja.', no_shipping_data: 'Sem dados de frete',
  add_products: 'Adicionar produtos', err_price: 'Informe um preço válido.',
  tracking: 'Rastreio', tracking_note: 'Os scripts só carregam depois que o visitante aceita os cookies.', google_verification: 'Verificação do Google (Search Console)',
  cookie_notice: 'Texto do aviso de cookies', cookie_notice_help: 'Em branco, usa o texto padrão.', seo: 'SEO padrão da loja', seo_title: 'Título (até 70)',
  seo_description: 'Descrição (até 160)', og_image: 'Imagem de compartilhamento (https)',
  err_gtm: 'GTM inválido: use GTM-XXXX.', err_ga4: 'GA4 inválido: use G-XXXXXXXX.', err_pixel: 'Pixel inválido: apenas números (8 a 20).',
  err_google: 'Código de verificação inválido.', err_seo_title: 'No máximo 70 caracteres.', err_seo_description: 'No máximo 160 caracteres.',
  err_image_url: 'Use um link https de imagem (.png, .jpg, .webp, .gif ou .avif).', err_color: 'Use uma cor no formato #RRGGBB.',
  err_colors_all: 'Preencha as quatro cores (primária, secundária, fundo e texto) ou deixe todas em branco.',
  template: 'Template', choose_template: 'Escolha um template', apply_template: 'Aplicar template', confirm_template: 'Aplicar o template substitui o rascunho atual. Continuar?',
  template_applied: 'Template aplicado ao rascunho.', logo_url: 'Logo (https)', favicon_url: 'Ícone (https)', banner_url: 'Banner (https)',
  color_primaria: 'Cor primária', color_secundaria: 'Cor secundária', color_fundo: 'Fundo', color_texto: 'Texto', color_destaque: 'Destaque',
  font: 'Fonte', font_sistema: 'Do sistema', font_serifada: 'Serifada', font_moderna: 'Moderna', font_arredondada: 'Arredondada', font_monoespacada: 'Monoespaçada',
  button_style: 'Botões', button_arredondado: 'Arredondado', button_quadrado: 'Quadrado', button_pilula: 'Pílula',
  card_style: 'Cartões', card_sombra: 'Sombra', card_borda: 'Borda', card_plano: 'Plano',
  home_page: 'Página inicial', page_slug: 'Endereço da página', page_title: 'Título da página', add_page: 'Criar página', remove_page: 'Remover página',
  add_block: 'Adicionar bloco', no_blocks: 'Nenhum bloco nesta página.', advanced_block: 'Este bloco é editado em breve; ele é mantido como está.', move_up: 'Subir', move_down: 'Descer',
  err_page_slug: 'Use letras minúsculas, números e hífen.', err_page_reserved: 'Este endereço é reservado.', err_page_exists: 'Já existe uma página com este endereço.',
  field_titulo: 'Título', field_subtitulo: 'Subtítulo', field_botao_texto: 'Texto do botão', field_botao_link: 'Link do botão (https)', field_imagem_url: 'Imagem (https)',
  field_html: 'Texto', field_quantidade: 'Quantidade', field_url: 'Imagem (https)', field_alt: 'Texto alternativo', field_link: 'Link (https)',
  field_email: 'E-mail', field_telefone: 'Telefone', field_texto: 'Texto',
  domain_name: 'Domínio', add_domain: 'Adicionar domínio', domain_added: 'Domínio cadastrado. Configure o DNS e verifique.', domain_removed: 'Domínio removido.',
  no_domains: 'Nenhum domínio próprio. A loja usa o endereço padrão.', verify: 'Verificar', confirm_remove_domain: 'Remover este domínio?',
  domain_PENDENTE: 'Pendente', domain_VERIFICADO: 'Verificado', tls_ATIVO: 'ativo', tls_EMITINDO: 'emitindo', tls_FALHA: 'falhou',
  tls_failed: 'Não foi possível emitir o certificado. Tentaremos de novo automaticamente.',
  dns_txt: 'Crie um registro TXT em {name} com o valor {value}.', dns_cname: 'Aponte o domínio (CNAME ou A) para {value}.', verify_pending: 'Ainda não encontramos: {items}. O DNS pode demorar a propagar.',
  invite: 'Convidar', invite_sent: 'Convite enviado.', pending_invite: 'convite pendente', confirm_remove_member: 'Remover este membro?', member_removed: 'Membro removido.',
  store_name: 'Nome da loja', footer_text: 'Texto do rodapé', business: 'Dados do negócio', legal_name: 'Razão social',
  api_GENERIC: 'Não foi possível concluir agora. Tente de novo.', api_STORE_NOT_FOUND: 'Loja não encontrada.', api_FORBIDDEN: 'Você não tem permissão para isso.',
  api_RATE_LIMIT: 'Muitas tentativas. Aguarde um instante.', api_STORE_SUSPENDED: 'A loja está suspensa pela administração.', api_STORE_LIMIT_REACHED: 'Você atingiu o limite de lojas.',
  api_NO_ACTIVE_PRODUCTS: 'Aloque ao menos um produto ativo antes de publicar.', api_SLUG_TAKEN: 'Este endereço já está em uso.', api_INVALID_SLUG: 'Endereço de loja inválido.',
  api_INVALID_STATE: 'A loja não está em um estado que permita isso.', api_VALIDATION_ERROR: 'Alguns dados são inválidos. Confira os campos.', api_INVALID_CONFIG: 'A configuração tem erros e não pôde ser publicada.',
  api_INVALID_TEMPLATE: 'Template inválido.', api_TEMPLATE_NOT_FOUND: 'Template não encontrado.', api_VERSION_NOT_FOUND: 'Versão não encontrada.',
  api_PRICE_BELOW_MINIMUM: 'O preço está abaixo do mínimo permitido.', api_ALREADY_ALLOCATED: 'O produto já está na loja.', api_ALREADY_MEMBER: 'Esta pessoa já faz parte da equipe.',
  api_INVITE_CONFLICT: 'Já existe um convite pendente para este e-mail.', api_INVITE_LIMIT_REACHED: 'Limite diário de convites atingido.', api_OWNER_IMMUTABLE: 'O papel do dono não pode ser alterado.',
  api_MEMBER_NOT_FOUND: 'Membro não encontrado.', api_INVALID_DOMAIN: 'Domínio inválido.', api_RESERVED_DOMAIN: 'Este domínio é reservado.', api_DOMAIN_NOT_FOUND: 'Domínio não encontrado.',
  api_DOMAIN_IN_USE: 'Este domínio já está cadastrado.', api_DOMAIN_LIMIT: 'A loja já tem um domínio próprio. Remova o atual para cadastrar outro.',
  api_VERIFY_TOO_SOON: 'Aguarde alguns segundos para verificar de novo.', api_UNAUTHORIZED: 'Sua sessão expirou. Entre de novo.',
  api_INSUFFICIENT_ROLE: 'Seu papel na loja não permite isso.', api_TERMS_OUTDATED: 'Aceite a versão atual dos termos para continuar.',
  api_DROPSHIPPER_NOT_APPROVED: 'Seu cadastro de dropshipper ainda não foi aprovado.', api_DROPSHIPPER_SUSPENDED: 'Seu cadastro de dropshipper está suspenso.',
  api_NOT_A_DROPSHIPPER: 'Esta conta não é de dropshipper.', api_ALLOCATION_NOT_FOUND: 'Este produto não está nesta loja.', api_PRODUCT_NOT_FOUND: 'Produto não encontrado.',
  api_PRODUCT_INACTIVE: 'O produto está inativo.', api_PRODUCER_CONFLICT: 'Você não pode vender produtos do próprio cadastro de produtor.',
  api_INVITE_NOT_FOUND: 'Convite não encontrado.', api_INVITE_EXPIRED: 'O convite expirou.', api_EMAIL_MISMATCH: 'O e-mail não corresponde ao do convite.', api_EMAIL_NOT_VERIFIED: 'Confirme o seu e-mail primeiro.',
};

const en = {
  language: 'Language', save: 'Save', saved: 'Saved.', saved_draft: 'Saved to the draft. Publish for visitors to see it.', remove: 'Remove', resend: 'Resend',
  status: 'Status', active: 'Active', inactive: 'Inactive', paused: 'Paused', default: 'Default', optional: 'optional', read_only: 'You can only view this section.',
  email: 'E-mail', phone: 'Phone', address: 'Address', role: 'Role',
  role_dono: 'Owner', role_editor: 'Editor', role_financeiro: 'Finance',
  not_found_title: 'Store not found', not_found_text: 'This store does not exist or you do not have access to it.', no_stores: 'You do not have a store yet.', create_store: 'Create store',
  menu_overview: 'Overview', menu_products: 'Products and margins', menu_orders: 'Orders and finance', menu_appearance: 'Appearance', menu_pages: 'Pages',
  menu_domain: 'Domain', menu_marketing: 'Marketing and SEO', menu_team: 'Team', menu_settings: 'Settings',
  status_active: 'Published', status_paused: 'Paused', status_draft: 'Draft', status_suspended: 'Suspended',
  has_changes: 'Unpublished changes', no_changes: 'Everything published', version: 'Version {n}', open_store: 'Open the store',
  checklist: 'Before publishing', check_product: 'At least one active product', check_shipping: 'Shipping data for the products', check_logo: 'Store logo',
  check_business: 'Business details (legal name and a contact)', check_domain: 'Custom domain with active TLS',
  publish: 'Publish', pause: 'Pause store', preview: 'Preview', missing: 'Missing: {items}.', owner_activates: 'Only the owner can activate the store.',
  published_ok: 'Store published.', paused_ok: 'Store paused.',
  preview_live: 'See the store with the draft', preview_live_hint: 'Opens the store with the draft, only for you, for 15 minutes. Visitors keep seeing the published version.',
  preview_home: 'Home page', preview_note: 'Summary of the draft (the live store only changes when you publish).',
  block_hero: 'Hero', block_produtos_destaque: 'Featured products', block_texto: 'Text', block_imagem: 'Image', block_faq: 'FAQ',
  block_depoimentos: 'Testimonials', block_newsletter: 'Newsletter', block_contato: 'Contact',
  product: 'Product', sale_price: 'Sale price', min_price: 'Minimum price', no_products: 'No products allocated to this store.', no_shipping_data: 'No shipping data',
  add_products: 'Add products', err_price: 'Enter a valid price.',
  tracking: 'Tracking', tracking_note: 'Scripts only load after the visitor accepts cookies.', google_verification: 'Google verification (Search Console)',
  cookie_notice: 'Cookie notice text', cookie_notice_help: 'Leave blank to use the default text.', seo: 'Store default SEO', seo_title: 'Title (up to 70)',
  seo_description: 'Description (up to 160)', og_image: 'Sharing image (https)',
  err_gtm: 'Invalid GTM: use GTM-XXXX.', err_ga4: 'Invalid GA4: use G-XXXXXXXX.', err_pixel: 'Invalid Pixel: digits only (8 to 20).',
  err_google: 'Invalid verification code.', err_seo_title: 'At most 70 characters.', err_seo_description: 'At most 160 characters.',
  err_image_url: 'Use an https image link (.png, .jpg, .webp, .gif or .avif).', err_color: 'Use a color in the #RRGGBB format.',
  err_colors_all: 'Fill in the four colors (primary, secondary, background and text) or leave them all blank.',
  template: 'Template', choose_template: 'Choose a template', apply_template: 'Apply template', confirm_template: 'Applying the template replaces the current draft. Continue?',
  template_applied: 'Template applied to the draft.', logo_url: 'Logo (https)', favicon_url: 'Icon (https)', banner_url: 'Banner (https)',
  color_primaria: 'Primary color', color_secundaria: 'Secondary color', color_fundo: 'Background', color_texto: 'Text', color_destaque: 'Accent',
  font: 'Font', font_sistema: 'System', font_serifada: 'Serif', font_moderna: 'Modern', font_arredondada: 'Rounded', font_monoespacada: 'Monospace',
  button_style: 'Buttons', button_arredondado: 'Rounded', button_quadrado: 'Square', button_pilula: 'Pill',
  card_style: 'Cards', card_sombra: 'Shadow', card_borda: 'Border', card_plano: 'Flat',
  home_page: 'Home page', page_slug: 'Page address', page_title: 'Page title', add_page: 'Create page', remove_page: 'Remove page',
  add_block: 'Add block', no_blocks: 'No blocks on this page.', advanced_block: 'This block will be editable soon; it is kept as is.', move_up: 'Move up', move_down: 'Move down',
  err_page_slug: 'Use lowercase letters, numbers and hyphens.', err_page_reserved: 'This address is reserved.', err_page_exists: 'A page with this address already exists.',
  field_titulo: 'Title', field_subtitulo: 'Subtitle', field_botao_texto: 'Button text', field_botao_link: 'Button link (https)', field_imagem_url: 'Image (https)',
  field_html: 'Text', field_quantidade: 'Quantity', field_url: 'Image (https)', field_alt: 'Alt text', field_link: 'Link (https)',
  field_email: 'E-mail', field_telefone: 'Phone', field_texto: 'Text',
  domain_name: 'Domain', add_domain: 'Add domain', domain_added: 'Domain added. Set up the DNS and verify.', domain_removed: 'Domain removed.',
  no_domains: 'No custom domain. The store uses the default address.', verify: 'Verify', confirm_remove_domain: 'Remove this domain?',
  domain_PENDENTE: 'Pending', domain_VERIFICADO: 'Verified', tls_ATIVO: 'active', tls_EMITINDO: 'issuing', tls_FALHA: 'failed',
  tls_failed: 'We could not issue the certificate. We will retry automatically.',
  dns_txt: 'Create a TXT record at {name} with the value {value}.', dns_cname: 'Point the domain (CNAME or A) to {value}.', verify_pending: 'Not found yet: {items}. DNS can take a while to propagate.',
  invite: 'Invite', invite_sent: 'Invitation sent.', pending_invite: 'pending invitation', confirm_remove_member: 'Remove this member?', member_removed: 'Member removed.',
  store_name: 'Store name', footer_text: 'Footer text', business: 'Business details', legal_name: 'Legal name',
  api_GENERIC: 'We could not finish that right now. Please try again.', api_STORE_NOT_FOUND: 'Store not found.', api_FORBIDDEN: 'You do not have permission for that.',
  api_RATE_LIMIT: 'Too many attempts. Please wait a moment.', api_STORE_SUSPENDED: 'The store is suspended by the administration.', api_STORE_LIMIT_REACHED: 'You reached the store limit.',
  api_NO_ACTIVE_PRODUCTS: 'Allocate at least one active product before publishing.', api_SLUG_TAKEN: 'This address is already in use.', api_INVALID_SLUG: 'Invalid store address.',
  api_INVALID_STATE: 'The store is not in a state that allows this.', api_VALIDATION_ERROR: 'Some data is invalid. Check the fields.', api_INVALID_CONFIG: 'The configuration has errors and could not be published.',
  api_INVALID_TEMPLATE: 'Invalid template.', api_TEMPLATE_NOT_FOUND: 'Template not found.', api_VERSION_NOT_FOUND: 'Version not found.',
  api_PRICE_BELOW_MINIMUM: 'The price is below the allowed minimum.', api_ALREADY_ALLOCATED: 'The product is already in the store.', api_ALREADY_MEMBER: 'This person is already on the team.',
  api_INVITE_CONFLICT: 'There is already a pending invitation for this e-mail.', api_INVITE_LIMIT_REACHED: 'Daily invitation limit reached.', api_OWNER_IMMUTABLE: "The owner's role cannot be changed.",
  api_MEMBER_NOT_FOUND: 'Member not found.', api_INVALID_DOMAIN: 'Invalid domain.', api_RESERVED_DOMAIN: 'This domain is reserved.', api_DOMAIN_NOT_FOUND: 'Domain not found.',
  api_DOMAIN_IN_USE: 'This domain is already registered.', api_DOMAIN_LIMIT: 'The store already has a custom domain. Remove the current one to add another.',
  api_VERIFY_TOO_SOON: 'Wait a few seconds before verifying again.', api_UNAUTHORIZED: 'Your session expired. Sign in again.',
  api_INSUFFICIENT_ROLE: 'Your role in the store does not allow this.', api_TERMS_OUTDATED: 'Accept the current version of the terms to continue.',
  api_DROPSHIPPER_NOT_APPROVED: 'Your dropshipper registration has not been approved yet.', api_DROPSHIPPER_SUSPENDED: 'Your dropshipper registration is suspended.',
  api_NOT_A_DROPSHIPPER: 'This account is not a dropshipper.', api_ALLOCATION_NOT_FOUND: 'This product is not in this store.', api_PRODUCT_NOT_FOUND: 'Product not found.',
  api_PRODUCT_INACTIVE: 'The product is inactive.', api_PRODUCER_CONFLICT: 'You cannot sell products from your own producer account.',
  api_INVITE_NOT_FOUND: 'Invitation not found.', api_INVITE_EXPIRED: 'The invitation expired.', api_EMAIL_MISMATCH: 'The e-mail does not match the invitation.', api_EMAIL_NOT_VERIFIED: 'Confirm your e-mail first.',
};

export const DICTIONARIES = { pt, en };

/** Texto da chave no idioma; `{param}` é substituído. Chave ausente cai no português e, por fim, na própria chave (nunca quebra a tela). */
export function translate(lang, key, params) {
  const raw = DICTIONARIES[lang]?.[key] ?? DICTIONARIES[DEFAULT_LANG][key] ?? key;
  return params ? raw.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m)) : raw;
}

/** Idioma inicial: a escolha salva do usuário (se válida); sem escolha, português (o idioma do navegador não decide). */
export function initialLang(saved) {
  return LANGS.includes(saved) ? saved : DEFAULT_LANG;
}

/** Chaves que existem em um idioma e faltam no outro. */
export function keyDiff(dicts = DICTIONARIES) {
  const [a, b] = LANGS.map((l) => new Set(Object.keys(dicts[l])));
  return { onlyPt: [...a].filter((k) => !b.has(k)), onlyEn: [...b].filter((k) => !a.has(k)) };
}
