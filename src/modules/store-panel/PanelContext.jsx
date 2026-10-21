import React, { createContext, useContext } from 'react';

/** Loja selecionada, papel do usuário nela e os dados carregados pelo shell (rascunho, alocações, domínios). */
const PanelCtx = createContext(null);
export const PanelProvider = PanelCtx.Provider;
export function usePanel() {
  const ctx = useContext(PanelCtx);
  if (!ctx) throw new Error('usePanel deve ser usado dentro do StoreShell');
  return ctx;
}
export const BASE = (storeId) => `/api/v1/dropshipping/stores/${storeId}`;
