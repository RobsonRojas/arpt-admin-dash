import React, { useEffect, useState } from 'react';
import { Box, Button, FormControlLabel, Paper, Switch, TextField, Typography } from '@mui/material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';

/** Configurações: nome da loja, texto do rodapé e dados do negócio (exigidos pelo checklist de publicação). */
export default function Settings() {
  const { t, err } = useLang();
  const { store, config, access, reload, refreshStores, notify, setStoreName } = usePanel();
  const [nome, setNome] = useState(store.nome); const [rodape, setRodape] = useState({}); const [busy, setBusy] = useState(false);
  const editable = access === 'edit';
  useEffect(() => { setRodape(JSON.parse(JSON.stringify(config?.rascunho?.rodape ?? {}))); }, [config]);
  const neg = rodape.negocio ?? {};
  const setNeg = (k, v) => setRodape({ ...rodape, negocio: { ...neg, [k]: v } });

  const save = async () => {
    setBusy(true);
    const negocio = Object.fromEntries(Object.entries(neg).map(([k, v]) => [k, String(v ?? '').trim()]).filter(([, v]) => v !== ''));
    const out = { ...rodape }; delete out.negocio; if (Object.keys(negocio).length) out.negocio = negocio;
    if (!String(out.texto ?? '').trim()) delete out.texto;
    try {
      if (nome.trim() && nome.trim() !== store.nome) { await api.put(BASE(store.id), { nome: nome.trim() }); setStoreName(nome.trim()); }
      await api.put(`${BASE(store.id)}/storefront/draft`, { rodape: out });
      notify('success', t('saved_draft')); await reload();
    } catch (e) { notify('error', err(e)); } finally { setBusy(false); }
  };
  // Interruptor da pesquisa de visitantes: vale na hora (não passa pelo rascunho), como pausar a loja.
  const [pesquisa, setPesquisa] = useState(store.pesquisa_saida_ativa !== false);
  useEffect(() => { setPesquisa(store.pesquisa_saida_ativa !== false); }, [store.pesquisa_saida_ativa]);
  const alternarPesquisa = async (ativa) => {
    setBusy(true);
    try {
      const r = await api.put(`${BASE(store.id)}/pesquisa-saida`, { ativa });
      setPesquisa(r.data.ativa); notify('success', t(r.data.ativa ? 'survey_switch_on' : 'survey_switch_off')); await refreshStores();
    } catch (e) { notify('error', err(e)); } finally { setBusy(false); }
  };
  const f = (label, value, onChange, key, extra = {}) => <TextField fullWidth size="small" label={label} value={value ?? ''} disabled={!editable} onChange={(e) => onChange(e.target.value)} inputProps={{ 'data-testid': key }} {...extra} />;
  return (
    <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
      <Typography variant="h6">{t('menu_settings')}</Typography>
      {f(t('store_name'), nome, setNome, 'field-nome')}
      {f(t('footer_text'), rodape.texto, (v) => setRodape({ ...rodape, texto: v }), 'field-rodape', { multiline: true, minRows: 2 })}
      <Typography variant="subtitle1">{t('business')}</Typography>
      {f(t('legal_name'), neg.razao_social, (v) => setNeg('razao_social', v), 'field-razao')}
      {f('CNPJ', neg.cnpj, (v) => setNeg('cnpj', v), 'field-cnpj')}
      {f(t('email'), neg.email, (v) => setNeg('email', v), 'field-email')}
      {f(t('phone'), neg.telefone, (v) => setNeg('telefone', v), 'field-telefone')}
      {f(t('address'), neg.endereco, (v) => setNeg('endereco', v), 'field-endereco')}
      {editable ? <Box><Button variant="contained" onClick={save} disabled={busy} data-testid="save-settings">{t('save')}</Button></Box> : null}
      <Typography variant="subtitle1">{t('survey_switch')}</Typography>
      <FormControlLabel
        control={<Switch checked={pesquisa} disabled={!editable || busy} onChange={(e) => alternarPesquisa(e.target.checked)} inputProps={{ 'data-testid': 'survey-switch' }} />}
        label={t('survey_switch')}
      />
      <Typography variant="body2" color="text.secondary">{t('survey_switch_help')}</Typography>
    </Paper>
  );
}
