import React, { useEffect, useState } from 'react';
import { Box, Button, Chip, Paper, TextField, Typography } from '@mui/material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';
import { buildSeo, buildTracking, trackingStatus, validateSeo, validateTracking } from '../rules';
import { fieldErrors } from '../errors';

/** Marketing e SEO: IDs de rastreio (validados na hora, nada é salvo com formato errado) e SEO padrão da loja. */
export default function Marketing() {
  const { t, err } = useLang();
  const { store, config, access, reload, notify } = usePanel();
  const draft = config?.rascunho ?? {};
  const [track, setTrack] = useState({}); const [seo, setSeo] = useState({}); const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false); const [serverErrors, setServerErrors] = useState({});
  const editable = access === 'edit';
  useEffect(() => { setTrack({ ...(draft.tracking ?? {}) }); setSeo({ ...(draft.seo ?? {}) }); }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  const trackErrors = validateTracking(track); const seoErrors = validateSeo(seo);
  const hasError = Object.keys(trackErrors).length + Object.keys(seoErrors).length > 0;
  const active = trackingStatus(track);

  const save = async () => {
    setTouched(true);
    if (hasError) return;
    setBusy(true); setServerErrors({});
    try {
      await api.put(`${BASE(store.id)}/storefront/draft`, { tracking: buildTracking(track), seo: buildSeo(seo, draft.seo) });
      notify('success', t('saved_draft')); await reload();
    } catch (e) { setServerErrors(fieldErrors(e)); notify('error', err(e)); } finally { setBusy(false); }
  };
  const field = (obj, set, key, errs, label, extra = {}) => (
    <TextField fullWidth size="small" label={label} value={obj[key] ?? ''} disabled={!editable} onChange={(e) => set({ ...obj, [key]: e.target.value })}
      error={!!errs[key]} helperText={errs[key] ? t(errs[key]) : extra.help} inputProps={{ 'data-testid': `field-${key}` }} {...extra.props} />
  );
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
        <Typography variant="h6">{t('tracking')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('tracking_note')}</Typography>
        {[['gtm', 'GTM (GTM-XXXX)'], ['ga4', 'GA4 (G-XXXXXXXX)'], ['pixel', 'Pixel']].map(([k, label]) => (
          <Box key={k} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>{field(track, setTrack, k, trackErrors, label)}</Box>
            <Chip size="small" data-testid={`active-${k}`} data-active={active[k] ? '1' : '0'} color={active[k] ? 'success' : 'default'} label={active[k] ? t('active') : t('inactive')} sx={{ mt: 0.5 }} />
          </Box>
        ))}
        {field(track, setTrack, 'google_verificacao', trackErrors, t('google_verification'))}
        {field(track, setTrack, 'aviso_cookies', {}, t('cookie_notice'), { props: { multiline: true, minRows: 2 }, help: t('cookie_notice_help') })}
      </Paper>
      <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
        <Typography variant="h6">{t('seo')}</Typography>
        {field(seo, setSeo, 'titulo', seoErrors, t('seo_title'))}
        {field(seo, setSeo, 'descricao', seoErrors, t('seo_description'), { props: { multiline: true, minRows: 2 } })}
        {field(seo, setSeo, 'imagem_og_url', seoErrors, t('og_image'))}
      </Paper>
      {Object.keys(serverErrors).length > 0 && <Typography color="error" variant="body2">{Object.values(serverErrors).join(' · ')}</Typography>}
      {editable ? <Box><Button variant="contained" onClick={save} disabled={busy || hasError} data-testid="save-marketing">{t('save')}</Button></Box> : <Typography variant="body2" color="text.secondary">{t('read_only')}</Typography>}
    </Box>
  );
}
