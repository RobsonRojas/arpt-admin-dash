import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, Paper, Table, TableBody, TableCell, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';
import { acceptBody, AI_SECTIONS, MAX_REQUEST, previewConfig, proposeBody, releaseTime, sectionDiff } from '../ai';
import { storeLanguages } from '../templates';
import { TemplatePreview } from './TemplateGallery';

/** Resumo de uma seção para a comparação (contagens e textos curtos, sem HTML). */
function Resumo({ secao, lado }) {
  if (secao === 'tema') return lado ? <span>{[lado.fonte, ...Object.values(lado.cores ?? {})].filter(Boolean).join(' · ') || '—'}</span> : <span>—</span>;
  if (secao === 'rodape') return <span>{lado?.texto || '—'}</span>;
  if (secao === 'seo') return <span>{lado?.titulo || '—'}</span>;
  return <span>{Array.isArray(lado) ? lado.length : 0}</span>;
}

/**
 * Assistente de IA da vitrine (add-ai-storefront-customization, 5.1 a 5.3a): pedido, idiomas, aviso de privacidade, proposta com
 * comparação e pré-visualização, e aceite por seção. Nada vai ao rascunho sem o aceite.
 */
export default function AiAssistant() {
  const { t, err, lang } = useLang();
  const { store, config, reload, notify } = usePanel();
  const [estado, setEstado] = useState(null);
  const [pedido, setPedido] = useState('');
  const [idiomas, setIdiomas] = useState(() => storeLanguages(config?.rascunho));
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [proposta, setProposta] = useState(null);
  const [secoes, setSecoes] = useState([]);
  const [verEm, setVerEm] = useState('pt');

  const carregarEstado = () => api.get(`${BASE(store.id)}/storefront/ai`).then((r) => setEstado(r.data)).catch(() => setEstado({ disponivel: false }));
  useEffect(() => { api.get(`${BASE(store.id)}/storefront/ai`).then((r) => setEstado(r.data)).catch(() => setEstado({ disponivel: false })); }, [store.id]);

  const body = proposeBody(pedido, idiomas);
  const diff = proposta ? sectionDiff(config?.rascunho, proposta.proposta, verEm) : null;

  const pedir = async () => {
    setCarregando(true); setErro(null);
    try {
      const r = await api.post(`${BASE(store.id)}/storefront/ai/propose`, body);
      setProposta(r.data); setVerEm(r.data.idiomas[0]);
      const d = sectionDiff(config?.rascunho, r.data.proposta, r.data.idiomas[0]);
      setSecoes(AI_SECTIONS.filter((s) => d[s].changed));
    } catch (e) {
      const libera = e?.response?.data?.libera_em;
      setErro(e?.response?.status === 429 && libera ? t('ai_limit', { quando: releaseTime(libera, lang) }) : err(e));
    } finally { setCarregando(false); carregarEstado(); }
  };
  const aceitar = async () => {
    try {
      await api.post(`${BASE(store.id)}/storefront/ai/accept`, acceptBody(proposta.proposta_id, secoes));
      notify('success', t('ai_accepted')); setProposta(null); await reload();
    } catch (e) { notify('error', err(e)); }
  };
  const descartar = () => { setProposta(null); notify('info', t('ai_discarded')); };
  const alternar = (lista, set, v) => set(lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

  if (!estado) return null;
  return (
    <Paper sx={{ p: 2, display: 'grid', gap: 2 }} data-testid="ai-assistant">
      <Box>
        <Typography variant="h6">{t('ai_title')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('ai_intro')}</Typography>
      </Box>
      {!estado.disponivel ? <Alert severity="info" data-testid="ai-unavailable">{t('ai_unavailable')}</Alert> : (
        <>
          <Alert severity="warning" data-testid="ai-privacy">{t('ai_privacy')}</Alert>
          <TextField multiline minRows={2} label={t('ai_request')} placeholder={t('ai_request_hint')} value={pedido} onChange={(e) => setPedido(e.target.value)}
            inputProps={{ maxLength: MAX_REQUEST, 'data-testid': 'ai-request' }} helperText={`${pedido.length}/${MAX_REQUEST}`} />
          <Box>
            <Typography variant="subtitle2">{t('ai_langs')}</Typography>
            {['pt', 'en'].map((l) => <FormControlLabel key={l} control={<Checkbox size="small" checked={idiomas.includes(l)} onChange={() => alternar(idiomas, setIdiomas, l)} inputProps={{ 'data-testid': `ai-lang-${l}` }} />} label={t(`lang_${l}`)} />)}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" disabled={!body || carregando || estado.esgotado} onClick={pedir} data-testid="ai-propose">{t('ai_propose')}</Button>
            {carregando && <><CircularProgress size={20} /><Typography variant="body2">{t('ai_loading')}</Typography></>}
            {!estado.esgotado && <Typography variant="caption" color="text.secondary" data-testid="ai-remaining">{t('ai_remaining', { hora: estado.restantes_hora, dia: estado.restantes_dia })}</Typography>}
          </Box>
          {estado.esgotado && !erro && <Alert severity="info" data-testid="ai-limit">{t('ai_limit', { quando: releaseTime(estado.libera_em, lang) })}</Alert>}
          {erro && <Alert severity="error" data-testid="ai-error">{erro}</Alert>}
        </>
      )}

      {proposta && diff && (
        <Box sx={{ display: 'grid', gap: 2 }} data-testid="ai-proposal">
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="subtitle1">{t('ai_compare')}</Typography>
            {proposta.idiomas.length > 1 && (
              <ToggleButtonGroup size="small" exclusive value={verEm} onChange={(_e, v) => v && setVerEm(v)}>
                {proposta.idiomas.map((l) => <ToggleButton key={l} value={l} data-testid={`ai-view-${l}`}>{t(`lang_${l}`)}</ToggleButton>)}
              </ToggleButtonGroup>
            )}
          </Box>
          <Table size="small">
            <TableBody>
              {AI_SECTIONS.map((s) => (
                <TableRow key={s} data-testid={`ai-row-${s}`}>
                  <TableCell padding="checkbox"><Checkbox size="small" checked={secoes.includes(s)} onChange={() => alternar(secoes, setSecoes, s)} inputProps={{ 'data-testid': `ai-accept-${s}`, 'aria-label': t(`ai_section_${s}`) }} /></TableCell>
                  <TableCell>{t(`ai_section_${s}`)}</TableCell>
                  <TableCell><Resumo secao={s} lado={diff[s].before} /></TableCell>
                  <TableCell>→ <Resumo secao={s} lado={diff[s].after} /></TableCell>
                  <TableCell>{diff[s].changed ? <Chip size="small" color="primary" label={t('ai_changed')} /> : <Chip size="small" label={t('ai_unchanged')} />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TemplatePreview config={previewConfig(proposta.proposta, verEm)} lang={verEm} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" disabled={!acceptBody(proposta.proposta_id, secoes)} onClick={aceitar} data-testid="ai-accept">{t('ai_accept_selected')}</Button>
            <Button onClick={descartar} data-testid="ai-discard">{t('ai_discard')}</Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
