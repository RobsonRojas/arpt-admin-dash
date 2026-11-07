import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { ArrowDownward, ArrowUpward, Delete } from '@mui/icons-material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';
import { addBlock, addPage, BLOCK_FIELDS, EDITABLE_TYPES, moveBlock, removeBlock, removePage, setBlockField, validatePageSlug } from '../blocks';
import { fieldErrors } from '../errors';

const HOME = '__home__';

/** Páginas e blocos: a página inicial e as páginas institucionais. Grava no rascunho; o visitante só vê ao publicar. */
export default function Pages() {
  const { t, err } = useLang();
  const { store, config, access, reload, notify } = usePanel();
  const [home, setHome] = useState([]); const [paginas, setPaginas] = useState({});
  const [current, setCurrent] = useState(HOME); const [newSlug, setNewSlug] = useState(''); const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false); const [serverErrors, setServerErrors] = useState({}); const [newType, setNewType] = useState('texto');
  const editable = access === 'edit';
  useEffect(() => {
    setHome(JSON.parse(JSON.stringify(config?.rascunho?.blocos ?? []))); setPaginas(JSON.parse(JSON.stringify(config?.rascunho?.paginas ?? {})));
  }, [config]);
  useEffect(() => { if (current !== HOME && !paginas[current]) setCurrent(HOME); }, [paginas, current]);

  const blocos = current === HOME ? home : paginas[current]?.blocos ?? [];
  const setBlocos = (next) => (current === HOME ? setHome(next) : setPaginas({ ...paginas, [current]: { ...paginas[current], blocos: next } }));
  const slugError = newSlug ? validatePageSlug(newSlug, paginas) : null;

  const save = async () => {
    setBusy(true); setServerErrors({});
    try { await api.put(`${BASE(store.id)}/storefront/draft`, { blocos: home, paginas }); notify('success', t('saved_draft')); await reload(); }
    catch (e) { setServerErrors(fieldErrors(e)); notify('error', err(e)); } finally { setBusy(false); }
  };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select size="small" value={current} onChange={(e) => setCurrent(e.target.value)} data-testid="page-select">
          <MenuItem value={HOME}>{t('home_page')}</MenuItem>
          {Object.entries(paginas).map(([slug, p]) => <MenuItem key={slug} value={slug}>/{slug} — {p.titulo}</MenuItem>)}
        </Select>
        {editable && current !== HOME && <Button size="small" color="error" onClick={() => setPaginas(removePage(paginas, current))} data-testid="remove-page">{t('remove_page')}</Button>}
        <Box sx={{ flex: 1 }} />
        {editable && <>
          <TextField size="small" label={t('page_slug')} value={newSlug} onChange={(e) => setNewSlug(e.target.value)} error={!!slugError} helperText={slugError ? t(slugError) : ''} inputProps={{ 'data-testid': 'new-page-slug' }} />
          <TextField size="small" label={t('page_title')} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} inputProps={{ 'data-testid': 'new-page-title' }} />
          <Button disabled={!newSlug || !!slugError || !newTitle.trim()} onClick={() => { setPaginas(addPage(paginas, newSlug, newTitle)); setCurrent(newSlug.trim().toLowerCase()); setNewSlug(''); setNewTitle(''); }} data-testid="add-page">{t('add_page')}</Button>
        </>}
      </Paper>

      {blocos.map((b, i) => (
        <Paper key={b.id} sx={{ p: 2, display: 'grid', gap: 1 }} data-testid={`block-${b.id}`}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ flex: 1 }}>{t(`block_${b.tipo}`)}</Typography>
            {editable && <>
              <IconButton size="small" disabled={i === 0} onClick={() => setBlocos(moveBlock(blocos, b.id, -1))} aria-label={t('move_up')} data-testid={`up-${b.id}`}><ArrowUpward fontSize="small" /></IconButton>
              <IconButton size="small" disabled={i === blocos.length - 1} onClick={() => setBlocos(moveBlock(blocos, b.id, 1))} aria-label={t('move_down')} data-testid={`down-${b.id}`}><ArrowDownward fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => setBlocos(removeBlock(blocos, b.id))} aria-label={t('remove')} data-testid={`remove-${b.id}`}><Delete fontSize="small" /></IconButton>
            </>}
          </Box>
          {EDITABLE_TYPES.includes(b.tipo)
            ? BLOCK_FIELDS[b.tipo].map(([key, kind]) => (
              <TextField key={key} size="small" fullWidth label={t(`field_${key}`)} value={b[key] ?? ''} disabled={!editable} type={kind === 'number' ? 'number' : 'text'}
                multiline={kind === 'long'} minRows={kind === 'long' ? 3 : undefined} onChange={(e) => setBlocos(setBlockField(blocos, b.id, key, e.target.value, kind))} inputProps={{ 'data-testid': `${b.id}-${key}` }} />
            ))
            : <Typography variant="body2" color="text.secondary">{t('advanced_block')}</Typography>}
        </Paper>
      ))}
      {!blocos.length && <Typography color="text.secondary" data-testid="no-blocks">{t('no_blocks')}</Typography>}
      {editable && (
        <Paper sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select size="small" value={newType} onChange={(e) => setNewType(e.target.value)} data-testid="new-block-type">
            {EDITABLE_TYPES.map((x) => <MenuItem key={x} value={x}>{t(`block_${x}`)}</MenuItem>)}
          </Select>
          <Button onClick={() => setBlocos(addBlock(blocos, newType))} data-testid="add-block">{t('add_block')}</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={save} disabled={busy} data-testid="save-pages">{t('save')}</Button>
        </Paper>
      )}
      {Object.keys(serverErrors).length > 0 && <Typography color="error" variant="body2">{Object.values(serverErrors).join(' · ')}</Typography>}
      {!editable && <Typography variant="body2" color="text.secondary">{t('read_only')}</Typography>}
    </Box>
  );
}
