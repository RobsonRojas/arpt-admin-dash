import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Select, Snackbar, Tab, Tabs, Typography } from '@mui/material';
import { api } from '../../services/api';
import { LangProvider, useLang } from './LangContext';
import { PanelProvider, BASE } from './PanelContext';
import { accessFor, defaultSection, menuFor } from './permissions';
import Overview from './sections/Overview';
import Products from './sections/Products';
import Appearance from './sections/Appearance';
import Pages from './sections/Pages';
import Domain from './sections/Domain';
import Marketing from './sections/Marketing';
import Team from './sections/Team';
import Settings from './sections/Settings';
import Survey from './sections/Survey';
import StoreOrdersTab from '../../components/orders/StoreOrdersTab';
import MeuPerfilDropshipper from '../../components/dropshipping/MeuPerfilDropshipper';

const OrdersSection = ({ storeId, readOnly, papel }) => (
  <StoreOrdersTab storeId={storeId} readOnly={readOnly} podeVerRepasses={papel === 'dono' || papel === 'financeiro'} />
);
const SECTION_VIEW = {
  overview: Overview, products: Products, appearance: Appearance, pages: Pages, domain: Domain, marketing: Marketing, team: Team, survey: Survey, settings: Settings,
};

function NotFound() {
  const { t } = useLang();
  return <Box data-testid="store-not-found" sx={{ p: 4 }}><Typography variant="h5">{t('not_found_title')}</Typography><Typography color="text.secondary">{t('not_found_text')}</Typography></Box>;
}

/** `/loja`: abre a primeira loja do usuário. Sem loja, aponta para a criação (tela de Dropshipping). */
function StoreIndex() {
  const { t } = useLang();
  const [stores, setStores] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { api.get('/api/v1/dropshipping/stores').then((r) => setStores(r.data)).catch(() => setFailed(true)); }, []);
  if (failed) return <Alert severity="error">{t('api_GENERIC')}</Alert>;
  if (!stores) return <CircularProgress />;
  if (!stores.length) return (
    <Box sx={{ p: 3 }}>
      <MeuPerfilDropshipper />
      <Typography>{t('no_stores')}</Typography><Button href="/dropshipping" sx={{ mt: 1 }}>{t('create_store')}</Button>
    </Box>
  );
  return <Navigate to={`/loja/${stores[0].id}`} replace />;
}

/** Casca de uma loja: seletor, idioma, menu por papel e os dados compartilhados entre as seções. */
function StoreShell() {
  const { storeId, '*': rest } = useParams();
  const navigate = useNavigate();
  const { t, lang, setLang, err } = useLang();
  const [stores, setStores] = useState(null);
  const [data, setData] = useState({ config: null, products: [], domains: [] });
  const [toast, setToast] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Só as lojas DESTE usuário: loja alheia nunca aparece, e a URL dela cai em "não encontrada".
  const refreshStores = useCallback(() => api.get('/api/v1/dropshipping/stores').then((r) => setStores(r.data)).catch((e) => setLoadError(err(e))), []);
  useEffect(() => { refreshStores(); }, [refreshStores]);
  const store = useMemo(() => (stores ?? []).find((s) => String(s.id) === String(storeId)) ?? null, [stores, storeId]);
  const papel = store?.meu_papel ?? null;

  const reload = useCallback(async () => {
    if (!store) return;
    const base = BASE(store.id); const next = { config: null, products: [], domains: [] };
    const jobs = [
      api.get(`${base}/products`).then((r) => { next.products = r.data; }),
      ...(accessFor(papel, 'appearance') ? [api.get(`${base}/storefront`).then((r) => { next.config = r.data; })] : []),
      ...(accessFor(papel, 'domain') ? [api.get(`${base}/storefront/domains`).then((r) => { next.domains = r.data; })] : []),
    ];
    const results = await Promise.allSettled(jobs);
    const bad = results.find((r) => r.status === 'rejected' && r.reason?.response?.status !== 404);
    setData(next);
    if (bad) setToast({ severity: 'error', text: err(bad.reason) });
  }, [store?.id, papel]);
  useEffect(() => { reload(); }, [reload]);

  if (loadError) return <Alert severity="error">{loadError}</Alert>;
  if (!stores) return <CircularProgress />;
  if (!store) return <NotFound />;

  const menu = menuFor(papel);
  const section = rest ? rest.split('/')[0] : null;
  if (!section) return <Navigate to={`/loja/${store.id}/${defaultSection(papel)}`} replace />;
  const access = accessFor(papel, section);
  const notify = (severity, text) => setToast({ severity, text });
  const ctx = { store, papel, access, config: data.config, products: data.products, domains: data.domains, reload, refreshStores, notify, setStoreName: (nome) => setStores((l) => l.map((s) => (s.id === store.id ? { ...s, nome } : s))) };
  const View = SECTION_VIEW[section];

  return (
    <PanelProvider value={ctx}>
      <MeuPerfilDropshipper />
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select size="small" value={store.id} data-testid="store-select" onChange={(e) => navigate(`/loja/${e.target.value}/${defaultSection((stores.find((s) => s.id === e.target.value) ?? {}).meu_papel) ?? ''}`)}>
          {stores.map((s) => <MenuItem key={s.id} value={s.id}>{s.nome}</MenuItem>)}
        </Select>
        <Typography variant="body2" color="text.secondary" data-testid="my-role">{t(`role_${papel}`)}</Typography>
        <Box sx={{ flex: 1 }} />
        <Select size="small" value={lang} data-testid="lang-select" onChange={(e) => setLang(e.target.value)} aria-label={t('language')}>
          <MenuItem value="pt">Português</MenuItem><MenuItem value="en">English</MenuItem>
        </Select>
      </Paper>
      <Tabs value={menu.includes(section) ? section : false} onChange={(_, v) => navigate(`/loja/${store.id}/${v}`)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        {menu.map((id) => <Tab key={id} value={id} label={t(`menu_${id}`)} data-testid={`menu-${id}`} />)}
      </Tabs>
      {!access ? <NotFound /> : section === 'orders'
        ? <OrdersSection storeId={store.id} readOnly={access !== 'edit'} papel={papel} />
        : View ? <View /> : <NotFound />}
      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.severity} onClose={() => setToast(null)} data-testid="toast">{toast.text}</Alert> : <span />}
      </Snackbar>
    </PanelProvider>
  );
}

export default function StorePanel() {
  return (
    <LangProvider>
      <Routes>
        <Route index element={<StoreIndex />} />
        <Route path=":storeId/*" element={<StoreShell />} />
      </Routes>
    </LangProvider>
  );
}
