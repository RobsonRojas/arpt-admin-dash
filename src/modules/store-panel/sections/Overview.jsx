import React, { useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, Link, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';
import { canChangeStoreStatus, canPublishConfig } from '../permissions';
import { publishChecklist, statusKey, storeUrl } from '../rules';

const BASE_DOMAIN = import.meta.env.VITE_STOREFRONT_BASE_DOMAIN || 'arpt.site';
const LOCAL_URL = import.meta.env.VITE_STOREFRONT_LOCAL_URL || '';

/** Resumo do rascunho para a pré-visualização: o que a vitrine mostraria, sem renderizar a loja. */
function PreviewSummary({ preview }) {
  const { t } = useLang();
  const cfg = preview?.config ?? {};
  const cores = cfg.tema?.cores ?? {};
  const titles = (blocos) => (blocos ?? []).map((b, i) => <li key={b.id ?? i}>{t(`block_${b.tipo}`)}{b.titulo ? `: ${b.titulo}` : ''}</li>);
  return (
    <Box data-testid="preview-summary">
      <Typography variant="subtitle2">{preview?.loja?.nome}</Typography>
      {cfg.tema?.logo_url && <img src={cfg.tema.logo_url} alt="" style={{ maxHeight: 48 }} />}
      <Box sx={{ display: 'flex', gap: 1, my: 1 }}>{['primaria', 'secundaria', 'fundo', 'texto'].map((k) => <Box key={k} title={k} sx={{ width: 24, height: 24, border: '1px solid #ccc', bgcolor: cores[k] || '#fff' }} />)}</Box>
      <Typography variant="body2">{t('preview_home')}</Typography><ul>{titles(cfg.blocos)}</ul>
      {Object.entries(cfg.paginas ?? {}).map(([slug, p]) => <div key={slug}><Typography variant="body2">/{slug} — {p.titulo}</Typography><ul>{titles(p.blocos)}</ul></div>)}
      <Typography variant="caption" color="text.secondary">{t('preview_note')}</Typography>
    </Box>
  );
}

export default function Overview() {
  const { t, err } = useLang();
  const { store, papel, config, products, domains, reload, refreshStores, notify } = usePanel();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const base = BASE(store.id);
  const draft = config?.rascunho;
  const checklist = publishChecklist({ products, config: draft, domains });
  const status = statusKey(store.status);
  const url = storeUrl({ slug: store.slug, domains, baseDomain: BASE_DOMAIN, localUrl: LOCAL_URL });
  const canPublish = canPublishConfig(papel);
  const owner = canChangeStoreStatus(papel);

  const run = async (fn, okKey) => {
    setBusy(true);
    try { await fn(); notify('success', t(okKey)); await Promise.all([reload(), refreshStores()]); } catch (e) { notify('error', err(e)); } finally { setBusy(false); }
  };
  const publish = () => run(async () => {
    if (config?.tem_alteracoes || !config?.versao_publicada) await api.post(`${base}/storefront/publish`);
    if (owner && store.status !== 'ATIVA') await api.post(`${base}/publish`);
  }, 'published_ok');
  const pause = () => run(() => api.post(`${base}/pause`), 'paused_ok');
  // Pré-visualização RENDERIZADA: pede um token curto (15 min, só desta loja) e abre a loja com o rascunho. Visitantes não veem.
  const openLivePreview = async () => {
    // A aba é aberta já no clique (antes do pedido) para o navegador não bloqueá-la como pop-up.
    const tab = window.open('about:blank', '_blank');
    try {
      const { data } = await api.post(`${base}/storefront/preview-token`);
      const target = `${url}${url.includes('?') ? '&' : '?'}preview=${encodeURIComponent(data.token)}`;
      if (tab) tab.location.href = target; else window.location.href = target;
    } catch (e) { if (tab) tab.close(); notify('error', err(e)); }
  };
  const openPreview = async () => { try { setPreview((await api.get(`${base}/storefront/preview`)).data); } catch (e) { notify('error', err(e)); } };

  const missing = checklist.missing.map((id) => t(`check_${id}`)).join(', ');
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h6" data-testid="store-name">{store.nome}</Typography>
        <Chip label={t(`status_${status}`)} color={status === 'active' ? 'success' : status === 'suspended' ? 'error' : 'default'} data-testid="store-status" />
        {config && <Chip label={config.tem_alteracoes ? t('has_changes') : t('no_changes')} variant="outlined" data-testid="draft-state" />}
        {config?.versao_publicada ? <Typography variant="body2" color="text.secondary">{t('version', { n: config.versao_publicada })}</Typography> : null}
        {url && <Link href={url} target="_blank" rel="noreferrer" data-testid="store-link">{t('open_store')}</Link>}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>{t('checklist')}</Typography>
        <List dense data-testid="checklist">
          {checklist.items.map((i) => (
            <ListItem key={i.id} data-testid={`check-${i.id}`} data-ok={i.ok ? '1' : '0'}>
              {i.ok ? <CheckCircle color="success" fontSize="small" sx={{ mr: 1 }} /> : <RadioButtonUnchecked color={i.required ? 'warning' : 'disabled'} fontSize="small" sx={{ mr: 1 }} />}
              <ListItemText primary={t(`check_${i.id}`)} secondary={i.required ? null : t('optional')} />
            </ListItem>
          ))}
        </List>
        {papel === 'financeiro' ? <Alert severity="info">{t('read_only')}</Alert> : (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="contained" onClick={publish} disabled={busy || !canPublish || !checklist.canPublish} data-testid="publish">{t('publish')}</Button>
            {owner && store.status === 'ATIVA' && <Button variant="outlined" color="warning" onClick={pause} disabled={busy} data-testid="pause">{t('pause')}</Button>}
            <Button variant="text" onClick={openPreview} data-testid="preview-open">{t('preview')}</Button>
            {url && <Button variant="outlined" onClick={openLivePreview} data-testid="preview-live" title={t('preview_live_hint')}>{t('preview_live')}</Button>}
            {!checklist.canPublish && <Typography variant="body2" color="warning.main" data-testid="missing">{t('missing', { items: missing })}</Typography>}
            {canPublish && !owner && store.status !== 'ATIVA' && <Typography variant="body2" color="text.secondary">{t('owner_activates')}</Typography>}
          </Box>
        )}
      </Paper>
      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('preview')}</DialogTitle><DialogContent><PreviewSummary preview={preview} /></DialogContent>
      </Dialog>
    </Box>
  );
}
