// Quem vê e quem edita cada seção do painel da loja. É só conveniência de tela: a API decide de verdade (loja alheia = 404,
// papel sem permissão = 403). Funções puras, sem React.

export const ROLES = ['dono', 'editor', 'financeiro'];

/** `view`: papéis que enxergam a seção; `edit`: papéis que podem alterar. Quem não está em `view` nem vê o item no menu. */
export const SECTIONS = [
  { id: 'overview', view: ['dono', 'editor', 'financeiro'], edit: ['dono', 'editor'] },
  { id: 'products', view: ['dono', 'editor', 'financeiro'], edit: ['dono', 'editor'] },
  { id: 'orders', view: ['dono', 'financeiro'], edit: [] },
  { id: 'appearance', view: ['dono', 'editor'], edit: ['dono', 'editor'] },
  { id: 'pages', view: ['dono', 'editor'], edit: ['dono', 'editor'] },
  { id: 'domain', view: ['dono'], edit: ['dono'] },
  { id: 'marketing', view: ['dono', 'editor'], edit: ['dono', 'editor'] },
  { id: 'team', view: ['dono'], edit: ['dono'] },
  // Pesquisa de visitantes: só o dono (o texto livre pode trazer dado pessoal). Somente leitura.
  { id: 'survey', view: ['dono'], edit: [] },
  { id: 'settings', view: ['dono'], edit: ['dono'] },
];

const byId = (id) => SECTIONS.find((s) => s.id === id);

/** `'edit'`, `'view'` ou `null` para o papel naquela seção. */
export function accessFor(papel, sectionId) {
  const s = byId(sectionId);
  if (!s || !ROLES.includes(papel)) return null;
  if (s.edit.includes(papel)) return 'edit';
  return s.view.includes(papel) ? 'view' : null;
}

/** Seções do menu para o papel, na ordem do painel. */
export const menuFor = (papel) => SECTIONS.filter((s) => accessFor(papel, s.id)).map((s) => s.id);

/** Primeira seção que o papel vê (destino padrão ao abrir a loja). */
export const defaultSection = (papel) => menuFor(papel)[0] ?? null;

/** Só o dono publica/pausa a loja e gerencia equipe/domínio; dono e editor publicam a configuração da vitrine. */
export const canPublishConfig = (papel) => papel === 'dono' || papel === 'editor';
export const canChangeStoreStatus = (papel) => papel === 'dono';
