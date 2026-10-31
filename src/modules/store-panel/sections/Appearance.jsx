import React, { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';
import { validateTema } from '../rules';
import { fieldErrors } from '../errors';
import TemplateGallery from './TemplateGallery';

const COLORS = ['primaria', 'secundaria', 'fundo', 'texto', 'destaque'];
const FONTS = ['sistema', 'serifada', 'moderna', 'arredondada', 'monoespacada'];
const BUTTONS = ['arredondado', 'quadrado', 'pilula'];
const CARDS = ['sombra', 'borda', 'plano'];

/** Aparência: logo, imagens, cores, fonte e estilos; ou partir de um template da galeria. Grava no rascunho (publicar é no Visão geral). */
export default function Appearance() {
  const { t, err } = useLang();
  const { store, config, access, reload, notify } = usePanel();
  const [tema, setTema] = useState({});
  const [busy, setBusy] = useState(false); const [serverErrors, setServerErrors] = useState({});
  const editable = access === 'edit';
  useEffect(() => { setTema(JSON.parse(JSON.stringify(config?.rascunho?.tema ?? {}))); }, [config]);

  const errors = validateTema(tema);
  const hasError = Object.keys(errors).length > 0;

  const setCor = (k, v) => setTema({ ...tema, cores: { ...(tema.cores ?? {}), [k]: v } });
  const save = async () => {
    setBusy(true); setServerErrors({});
    const out = { ...tema };
    for (const k of ['logo_url', 'favicon_url', 'banner_url']) if (!out[k]) delete out[k];
    if (out.cores) { for (const c of COLORS) if (!out.cores[c]) delete out.cores[c]; if (!Object.keys(out.cores).length) delete out.cores; }
    try { await api.put(`${BASE(store.id)}/storefront/draft`, { tema: out }); notify('success', t('saved_draft')); await reload(); }
    catch (e) { setServerErrors(fieldErrors(e)); notify('error', err(e)); } finally { setBusy(false); }
  };
  const text = (key, label) => (
    <TextField fullWidth size="small" label={label} value={tema[key] ?? ''} disabled={!editable} onChange={(e) => setTema({ ...tema, [key]: e.target.value })}
      error={!!errors[key]} helperText={errors[key] ? t(errors[key]) : ''} inputProps={{ 'data-testid': `field-${key}` }} />
  );
  const sel = (key, label, values, prefix) => (
    <Box><Typography variant="caption">{label}</Typography>
      <Select fullWidth size="small" value={tema[key] ?? ''} displayEmpty disabled={!editable} onChange={(e) => setTema({ ...tema, [key]: e.target.value || undefined })} data-testid={`select-${key}`}>
        <MenuItem value="">{t('default')}</MenuItem>{values.map((v) => <MenuItem key={v} value={v}>{t(`${prefix}_${v}`)}</MenuItem>)}
      </Select></Box>
  );
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {editable && <TemplateGallery />}
      <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
        <Typography variant="h6">{t('menu_appearance')}</Typography>
        {text('logo_url', t('logo_url'))}{text('favicon_url', t('favicon_url'))}{text('banner_url', t('banner_url'))}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 2 }}>
          {COLORS.map((c) => (
            <TextField key={c} size="small" label={t(`color_${c}`)} value={tema.cores?.[c] ?? ''} disabled={!editable} onChange={(e) => setCor(c, e.target.value)}
              placeholder="#RRGGBB" error={!!errors[`cor_${c}`]} helperText={errors[`cor_${c}`] ? t(errors[`cor_${c}`]) : ''} inputProps={{ 'data-testid': `color-${c}` }} />
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          {sel('fonte', t('font'), FONTS, 'font')}{sel('estilo_botoes', t('button_style'), BUTTONS, 'button')}{sel('estilo_cards', t('card_style'), CARDS, 'card')}
        </Box>
        {Object.keys(serverErrors).length > 0 && <Typography color="error" variant="body2">{Object.values(serverErrors).join(' · ')}</Typography>}
        {editable ? <Box><Button variant="contained" onClick={save} disabled={busy || hasError} data-testid="save-appearance">{t('save')}</Button></Box> : <Typography variant="body2" color="text.secondary">{t('read_only')}</Typography>}
      </Paper>
    </Box>
  );
}
