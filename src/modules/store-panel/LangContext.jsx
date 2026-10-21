import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { initialLang, translate, LANGS } from './i18n';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { errorKey } from './errors';

const LangCtx = createContext(null);
/** A escolha é guardada por usuário (a chave leva o id dele): outro usuário no mesmo navegador não herda o idioma. */
export const langStorageKey = (uid) => `arpt_store_panel_lang:${uid ?? 'anon'}`;

/** Idioma do painel da loja, por usuário/navegador: escolha salva > idioma do navegador > português. */
export function LangProvider({ children }) {
  const { user } = useAuth();
  const storageKey = langStorageKey(user?.uid);
  const [lang, setLangState] = useState(() => {
    let saved = null;
    try { saved = window.localStorage.getItem(storageKey); } catch { /* armazenamento bloqueado */ }
    return initialLang(saved);
  });
  const setLang = useCallback((l) => {
    if (!LANGS.includes(l)) return;
    setLangState(l);
    try { window.localStorage.setItem(storageKey, l); } catch { /* segue sem salvar */ }
  }, [storageKey]);
  const value = useMemo(() => ({
    lang, setLang,
    t: (key, params) => translate(lang, key, params),
    /** Mensagem de um erro de API, no idioma do painel (pelo `code`). */
    err: (e) => translate(lang, errorKey(e)),
  }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}
export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error('useLang deve ser usado dentro de LangProvider');
  return ctx;
}
