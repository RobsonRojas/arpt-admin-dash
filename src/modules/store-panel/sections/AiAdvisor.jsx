import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Typography } from '@mui/material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';
import { acceptBody, releaseTime } from '../ai';
import { storeLanguages } from '../templates';

const SEV_COLOR = { alta: 'error', media: 'warning', baixa: 'default' };

/** Resumo curto da seção proposta (sem HTML): o que o dono vai aceitar. */
function resumoDaSecao(proposta, secao, lang) {
  const c = proposta?.conteudo?.[lang] ?? proposta?.conteudo?.pt ?? Object.values(proposta?.conteudo ?? {})[0];
  if (secao === 'tema') return [proposta?.tema?.fonte, ...Object.values(proposta?.tema?.cores ?? {})].filter(Boolean).join(' · ');
  if (secao === 'seo') return [c?.seo?.titulo, c?.seo?.descricao].filter(Boolean).join(' — ');
  if (secao === 'rodape') return c?.rodape?.texto ?? '';
  return String(Array.isArray(c?.[secao]) ? c[secao].length : 0);
}

/**
 * Consultor de IA da vitrine (add-llm-store-advisor, 5.1 a 5.3): sinais objetivos da loja, sugestões por severidade, aplicar na aparência
 * (gera proposta e só grava com o aceite), copiar texto de produto, dispensar e restaurar. A IA só sugere.
 */
export default function AiAdvisor() {
  const { t, err, lang } = useLang();
  const { store, config, reload, notify } = usePanel();
  const [estado, setEstado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [proposta, setProposta] = useState(null);

  const rota = `${BASE(store.id)}/storefront/ai`;
  const carregar = () => api.get(`${rota}/advice`).then((r) => setEstado(r.data)).catch(() => setEstado({ disponivel: false, sinais: null, analise: null, dispensadas: [] }));
  useEffect(() => { carregar(); }, [store.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const analisar = async () => {
    setCarregando(true); setErro(null);
    try { const r = await api.post(`${rota}/advise`, { idioma: lang === 'en' ? 'en' : 'pt' }); setEstado(r.data); } catch (e) {
      const libera = e?.response?.data?.libera_em ?? e?.response?.data?.details?.libera_em;
      setErro(e?.response?.status === 429 && libera ? t('adv_limit', { quando: releaseTime(libera, lang) }) : err(e));
    } finally { setCarregando(false); carregar(); }
  };
  const dispensar = async (chave) => { try { await api.post(`${rota}/advice/dismiss`, { chave }); await carregar(); } catch (e) { notify('error', err(e)); } };
  const restaurar = async (chave) => { try { await api.delete(`${rota}/advice/dismiss/${chave}`); await carregar(); } catch (e) { notify('error', err(e)); } };
  const copiar = async (texto) => { try { await navigator.clipboard.writeText(texto); notify('success', t('adv_copied')); } catch (e) { notify('error', err(e)); } };
  const aplicar = async (chave) => {
    setErro(null);
    try { const r = await api.post(`${rota}/advice/apply`, { chave, idiomas: storeLanguages(config?.rascunho) }); setProposta(r.data); } catch (e) { setErro(err(e)); }
  };
  const aceitar = async () => {
    const body = acceptBody(proposta.proposta_id, [proposta.secao_sugerida]);
    try { await api.post(`${rota}/accept`, body); notify('success', t('adv_accepted')); setProposta(null); await reload(); } catch (e) { notify('error', err(e)); }
  };
  const descartar = () => { setProposta(null); notify('info', t('adv_discarded')); };

  if (!estado) return null;
  const s = estado.sinais;
  const sugestoes = estado.analise?.sugestoes ?? [];
  const sim = (v) => (v ? t('adv_yes') : t('adv_no'));
  const cartoes = s ? [
    ['adv_sig_products', s.produtos_total], ['adv_sig_nodesc', s.produtos_sem_descricao], ['adv_sig_nophoto', s.produtos_sem_foto],
    ['adv_sig_noen', s.produtos_sem_ingles], ['adv_sig_seo', sim(s.seo_titulo && s.seo_descricao)], ['adv_sig_blocks', s.blocos],
    ['adv_sig_menu', s.menu], ['adv_sig_footer', sim(s.rodape)],
  ] : [];

  return (
    <Paper sx={{ p: 2, display: 'grid', gap: 2 }} data-testid="ai-advisor">
      <Box>
        <Typography variant="h6">{t('adv_title')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('adv_intro')}</Typography>
      </Box>

      {s && (
        <Box>
          <Typography variant="subtitle2">{t('adv_signals')}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1, mt: 1 }} data-testid="adv-signals">
            {cartoes.map(([k, v]) => (
              <Paper key={k} variant="outlined" sx={{ p: 1 }}><Typography variant="caption" color="text.secondary">{t(k)}</Typography><Typography variant="h6">{v}</Typography></Paper>
            ))}
          </Box>
        </Box>
      )}

      {!estado.disponivel ? <Alert severity="info" data-testid="adv-unavailable">{t('adv_unavailable')}</Alert> : (
        <>
          <Alert severity="warning" data-testid="adv-privacy">{t('adv_privacy')}</Alert>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" disabled={carregando || estado.esgotado} onClick={analisar} data-testid="adv-analyze">{t(estado.analise ? 'adv_reanalyze' : 'adv_analyze')}</Button>
            {carregando && <><CircularProgress size={20} /><Typography variant="body2">{t('adv_loading')}</Typography></>}
            {!estado.esgotado
              ? <Typography variant="caption" color="text.secondary" data-testid="adv-remaining">{t('adv_remaining', { dia: estado.restantes_dia })}</Typography>
              : <Alert severity="warning" data-testid="adv-limit">{t('adv_limit', { quando: releaseTime(estado.libera_em, lang) })}</Alert>}
          </Box>
          {erro && <Alert severity="error" data-testid="adv-error">{erro}</Alert>}
        </>
      )}

      {proposta && (
        <Paper variant="outlined" sx={{ p: 2, display: 'grid', gap: 1 }} data-testid="adv-proposal">
          <Typography variant="subtitle2">{t('adv_proposal')}: {t(`ai_section_${proposta.secao_sugerida}`)}</Typography>
          <Typography variant="body2" data-testid="adv-proposal-summary">{resumoDaSecao(proposta.proposta, proposta.secao_sugerida, lang)}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={aceitar} data-testid="adv-accept">{t('adv_accept')}</Button>
            <Button onClick={descartar} data-testid="adv-discard">{t('adv_discard')}</Button>
          </Box>
        </Paper>
      )}

      {estado.analise && <Typography variant="caption" color="text.secondary">{t('adv_generated', { quando: releaseTime(estado.analise.gerado_em, lang) })}</Typography>}
      {estado.analise && !sugestoes.length && <Typography variant="body2" data-testid="adv-none">{t('adv_none_left')}</Typography>}
      {!estado.analise && estado.disponivel && <Typography variant="body2" color="text.secondary">{t('adv_empty')}</Typography>}

      <Box sx={{ display: 'grid', gap: 1 }}>
        {sugestoes.map((x) => (
          <Paper key={x.chave} variant="outlined" sx={{ p: 1.5, display: 'grid', gap: 1 }} data-testid={`adv-item-${x.chave}`}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip size="small" color={SEV_COLOR[x.severidade] ?? 'default'} label={t(`adv_sev_${x.severidade}`)} />
              <Chip size="small" variant="outlined" label={x.produto_id ? t('adv_product', { id: x.produto_id }) : t('adv_store')} />
              <Typography variant="subtitle2">{x.titulo}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">{x.justificativa}</Typography>
            {x.texto_sugerido && <Paper variant="outlined" sx={{ p: 1, whiteSpace: 'pre-wrap' }} data-testid={`adv-text-${x.chave}`}><Typography variant="body2">{x.texto_sugerido}</Typography></Paper>}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {x.acao === 'aplicar_aparencia' && <Button size="small" variant="contained" onClick={() => aplicar(x.chave)} data-testid={`adv-apply-${x.chave}`}>{t('adv_apply')}</Button>}
              {x.acao === 'texto_produto' && x.texto_sugerido && <Button size="small" onClick={() => copiar(x.texto_sugerido)} data-testid={`adv-copy-${x.chave}`}>{t('adv_copy')}</Button>}
              <Button size="small" color="inherit" onClick={() => dispensar(x.chave)} data-testid={`adv-dismiss-${x.chave}`}>{t('adv_dismiss')}</Button>
            </Box>
          </Paper>
        ))}
      </Box>

      {estado.dispensadas?.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }} data-testid="adv-dismissed">
          <Typography variant="caption">{t('adv_dismissed')}:</Typography>
          {estado.dispensadas.map((c) => <Chip key={c} size="small" label={`${c} · ${t('adv_restore')}`} onClick={() => restaurar(c)} data-testid={`adv-restore-${c}`} />)}
        </Box>
      )}
    </Paper>
  );
}
