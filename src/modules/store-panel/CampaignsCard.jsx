import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, Paper, Stack, Typography } from '@mui/material';
import { api } from '../../services/api';
import { useLang } from './LangContext';

const dia = (v, lang) => new Date(v).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR');
const mensagemDe = (err, padrao) => err?.response?.data?.message || padrao;

/** Caixa opcional (desmarcada por padrão) do e-mail de campanhas: o e-mail é o da conta, escolhido pelo servidor. */
function PreferenciaEmail() {
  const { t } = useLang();
  const [recebe, setRecebe] = useState(null);
  const [aviso, setAviso] = useState(null);
  useEffect(() => {
    let vivo = true;
    api.get('/growth/preferencias/campanha-email').then((r) => { if (vivo) setRecebe(!!r.data.recebe); }).catch(() => { if (vivo) setRecebe(false); });
    return () => { vivo = false; };
  }, []);
  const mudar = async (receber) => {
    setAviso(null);
    try { await api.put('/growth/preferencias/campanha-email', { receber }); setRecebe(receber); setAviso('ok'); } catch { setAviso('erro'); }
  };
  if (recebe === null) return null;
  return (
    <Box data-testid="preferencia-email-campanha" sx={{ mt: 2 }}>
      <Typography variant="subtitle2">{t('camp_email_title')}</Typography>
      <FormControlLabel control={<Checkbox checked={recebe} onChange={(e) => mudar(e.target.checked)} />} label={t('camp_email_text')} />
      <Typography variant="caption" color="text.secondary" display="block">{t('camp_email_help')}</Typography>
      {aviso === 'ok' && <Alert severity="success" sx={{ mt: 1 }}>{t('camp_saved')}</Alert>}
      {aviso === 'erro' && <Alert severity="error" sx={{ mt: 1 }}>{t('camp_error')}</Alert>}
    </Box>
  );
}

/**
 * Cartão de campanhas no painel do dropshipper (campaign-adhesion): aviso de convite, condições, adesão e desistência. Só o servidor decide
 * quem é do público; o texto do administrador é mostrado como TEXTO, nunca como HTML. O aviso conta como "visto" uma vez e dispensar não volta.
 */
export default function CampaignsCard() {
  const { t, lang } = useLang();
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState(false);
  const [abertas, setAbertas] = useState({});
  const [acaoErro, setAcaoErro] = useState({});
  const vistos = useRef(new Set());

  const carregar = useCallback(async () => {
    try { const r = await api.get('/growth/campanhas'); setLista(Array.isArray(r?.data) ? r.data : []); setErro(false); } catch { setErro(true); }
  }, []); // sem `t` aqui: ele é recriado a cada render e faria a carga se repetir sem parar
  useEffect(() => { carregar(); }, [carregar]);

  const visiveis = (lista ?? []).filter((c) => c.aviso || c.aderiu);
  useEffect(() => {
    for (const c of visiveis) {
      if (c.aviso && !vistos.current.has(c.id)) { vistos.current.add(c.id); api.post(`/growth/campanhas/${c.id}/aviso/visto`).catch(() => undefined); }
    }
  }, [visiveis]);

  const dispensar = async (id) => {
    setLista((l) => (l ?? []).map((c) => (c.id === id ? { ...c, aviso: false, dispensada: true } : c)));
    try { await api.post(`/growth/campanhas/${id}/aviso/dispensar`); } catch { carregar(); }
  };
  const aderir = async (c, aderir_) => {
    setAcaoErro((e) => ({ ...e, [c.id]: '' }));
    try {
      if (aderir_) await api.post(`/growth/campanhas/${c.id}/adesao`, c.papel ? { papel: c.papel } : {});
      else await api.delete(`/growth/campanhas/${c.id}/adesao`);
      await carregar();
    } catch (e) { setAcaoErro((x) => ({ ...x, [c.id]: mensagemDe(e, t('camp_error')) })); }
  };

  if (erro) return <Alert severity="error">{t('camp_load_error')}</Alert>;
  if (!lista) return null;
  return (
    <Paper sx={{ p: 2 }} data-testid="campaigns-card">
      <Typography variant="h6" gutterBottom>
        {t('camp_title')}{visiveis.length > 0 && <Chip size="small" color="primary" sx={{ ml: 1 }} label={visiveis.length} data-testid="campaigns-count" />}
      </Typography>
      {visiveis.length === 0 && <Typography color="text.secondary">{t('camp_empty')}</Typography>}
      <Stack spacing={1.5}>
        {visiveis.map((c) => (
          <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }} data-testid={`campaign-${c.id}`}>
            <Typography variant="subtitle1" fontWeight={600}>
              {c.titulo}{c.aderiu && <Chip size="small" color="success" sx={{ ml: 1 }} label={t('camp_participating')} />}
            </Typography>
            <Typography variant="body2">{c.resumo}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{t('camp_valid_until', { data: dia(c.fim, lang) })}</Typography>
            {abertas[c.id] && (
              <Box sx={{ mb: 1 }} data-testid={`conditions-${c.id}`}>
                <Typography sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>{c.corpo}</Typography>
                <Box component="ul" sx={{ pl: 3, my: 0 }}>
                  {c.bonus && <li>{t('camp_bonus', { passo: String(c.bonus.passoPontos).replace('.', ','), teto: String(c.bonus.limiteComissaoTotal).replace('.', ','), meses: c.bonus.duracaoBonusMeses })} {t('camp_bonus_rule')}</li>}
                  {c.incentivos?.selo && <li>{t('camp_badge')}</li>}
                  {c.incentivos?.materiaisAntecipados && <li>{t('camp_materials')}</li>}
                </Box>
              </Box>
            )}
            {acaoErro[c.id] && <Alert severity="error" sx={{ mb: 1 }}>{acaoErro[c.id]}</Alert>}
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => setAbertas((a) => ({ ...a, [c.id]: !a[c.id] }))}>{t('camp_see')}</Button>
              {c.aderiu
                ? <Button size="small" variant="outlined" onClick={() => aderir(c, false)}>{t('camp_leave')}</Button>
                : <Button size="small" variant="contained" onClick={() => aderir(c, true)}>{t('camp_join')}</Button>}
              {c.aviso && <Button size="small" onClick={() => dispensar(c.id)}>{t('camp_hide')}</Button>}
            </Stack>
          </Paper>
        ))}
      </Stack>
      <PreferenciaEmail />
    </Paper>
  );
}
