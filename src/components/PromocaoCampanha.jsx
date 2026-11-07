import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormHelperText, Grid, MenuItem,
  Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { api } from '../services/api';
import {
  CANAIS, corpoPromocao, errosPromocao, estadoDoEnvio, ESTADOS_ENVIO, ETAPAS_PROMO, formDaPromocao, motivoCanalBloqueado, PUBLICOS, segmentosDoPublico,
} from '../utils/campaignOutreach';
import { percentual } from '../utils/growthCampaigns';

const BASE = '/admin/growth/campaigns';
const erroDoServidor = (err, padrao) => ({ mensagem: err?.response?.data?.message || padrao, campos: err?.response?.data?.campos || {} });

/** Aba "Promoção" do detalhe da campanha: público, texto, canais, prévia de alcance (só contagens) e funil de adesão. */
export function PromocaoCampanha({ campanha, tipo }) {
  const [dados, setDados] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [f, setF] = useState(formDaPromocao(null));
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(null); // { canal, ligar }
  const [erroCanal, setErroCanal] = useState('');
  const [erroCarga, setErroCarga] = useState('');

  const editavel = campanha.estado === 'rascunho';
  const incentivoDoTipo = !!tipo?.incentivo;

  const carregar = useCallback(async () => {
    setErroCarga('');
    try {
      const r = await api.get(`${BASE}/${campanha.id}/outreach`);
      setDados(r.data);
      setF(formDaPromocao(r.data.promocao));
      if (r.data.promocao) {
        const [p, m] = await Promise.all([api.get(`${BASE}/${campanha.id}/outreach/preview`), api.get(`${BASE}/${campanha.id}/outreach/metrics`)]);
        setPrevia(p.data); setMetricas(m.data);
      } else { setPrevia(null); setMetricas(null); }
    } catch { setErroCarga('Não foi possível carregar a promoção.'); }
  }, [campanha.id]);
  useEffect(() => { carregar(); }, [carregar, campanha.estado]);

  const set = (campo, valor) => { setSalvo(false); setF((x) => ({ ...x, [campo]: valor })); };
  const setInc = (campo, valor) => { setSalvo(false); setF((x) => ({ ...x, incentivos: { ...x.incentivos, [campo]: valor } })); };
  const campo = (nome, rotulo, extra = {}) => (
    <TextField fullWidth size="small" label={rotulo} value={f[nome] ?? ''} disabled={!editavel} onChange={(e) => set(nome, e.target.value)}
      error={!!erros[nome]} helperText={erros[nome]} {...extra} />
  );

  const salvar = async () => {
    const e = errosPromocao(f, { incentivoDoTipo, incentivosLigados: !!dados?.chaves?.incentivosFinanceiros });
    setErros(e); setSalvo(false);
    if (Object.keys(e).length) return;
    setSalvando(true); setErroGeral('');
    try {
      await api.put(`${BASE}/${campanha.id}/outreach`, corpoPromocao(f));
      setSalvo(true); await carregar();
    } catch (err) {
      const { mensagem, campos } = erroDoServidor(err, 'Não foi possível salvar a promoção.');
      setErros(campos); setErroGeral(mensagem);
    } finally { setSalvando(false); }
  };

  const mudarCanal = async () => {
    setErroCanal('');
    try {
      await api.post(`${BASE}/${campanha.id}/outreach/channels/${confirmando.canal}/${confirmando.ligar ? 'enable' : 'disable'}`);
      setConfirmando(null); await carregar();
    } catch (err) { setErroCanal(erroDoServidor(err, 'Não foi possível mudar o canal.').mensagem); }
  };

  if (erroCarga) return <Alert severity="error">{erroCarga}</Alert>;
  if (!dados) return <CircularProgress size={24} />;
  const promocao = dados.promocao;
  const canais = { notificacao: !!promocao?.canal_notificacao, email: !!promocao?.canal_email };
  const estadoEnvio = estadoDoEnvio({ campanhaEstado: campanha.estado, canais, envio: metricas?.envio, previa });
  const segmentos = segmentosDoPublico(f.publico);

  return (
    <Box data-testid="aba-promocao">
      <Typography variant="subtitle1" gutterBottom>Público e texto</Typography>
      {!editavel && <Alert severity="info" sx={{ mb: 2 }}>O texto e o público só podem ser alterados com a campanha em rascunho. Para mudar, duplique a campanha.</Alert>}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField select fullWidth size="small" label="Público" value={f.publico} disabled={!editavel} error={!!erros.publico} helperText={erros.publico}
            onChange={(e) => setF((x) => ({ ...x, publico: e.target.value, segmento: '' }))}>
            {Object.entries(PUBLICOS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField select fullWidth size="small" label="Segmento (opcional)" value={f.segmento} disabled={!editavel || f.publico === 'ambos'} error={!!erros.segmento}
            helperText={erros.segmento || (f.publico === 'ambos' ? 'Escolha um público só para usar segmento.' : '')} onChange={(e) => set('segmento', e.target.value)}>
            <MenuItem value="">Todos do público</MenuItem>
            {segmentos.map((s) => <MenuItem key={s.chave} value={s.chave}>{s.rotulo}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12}>{campo('titulo', 'Título')}</Grid>
        <Grid item xs={12}>{campo('resumo', 'Resumo (aparece no aviso)')}</Grid>
        <Grid item xs={12}>{campo('corpo', 'Texto da promoção', { multiline: true, minRows: 4 })}</Grid>
        <Grid item xs={12} md={4}>{campo('lembreteDias', 'Lembrete por e-mail após (dias)', { type: 'number', inputProps: { min: 1, max: 30 } })}</Grid>
        <Grid item xs={12} md={8}>
          <Box>
            <FormControlLabel disabled={!editavel} label="Selo de participante na vitrine e no perfil" control={<Checkbox checked={f.incentivos.selo} onChange={(e) => setInc('selo', e.target.checked)} />} />
            {/* Sem efeito por enquanto: o kit de imprensa e a página de parceiros são públicos, não há o que liberar antes. Fica desabilitado para não prometer. */}
            <FormControlLabel disabled label="Acesso antecipado aos materiais de divulgação (indisponível: os materiais hoje são públicos)" control={<Checkbox checked={false} />} />
            <FormControlLabel disabled={!editavel || !incentivoDoTipo} label="O texto cita o bônus de comissão" control={<Checkbox checked={f.incentivos.citaBonus} onChange={(e) => setInc('citaBonus', e.target.checked)} />} />
            {erros['incentivos.citaBonus'] && <FormHelperText error>{erros['incentivos.citaBonus']}</FormHelperText>}
          </Box>
        </Grid>
      </Grid>
      {erroGeral && <Alert severity="error" sx={{ mb: 2 }}>{erroGeral}</Alert>}
      {salvo && <Alert severity="success" sx={{ mb: 2 }}>Promoção salva como rascunho. Nada foi enviado.</Alert>}
      {editavel && <Button variant="contained" onClick={salvar} disabled={salvando} sx={{ mb: 3 }}>Salvar promoção</Button>}

      {!promocao ? (
        <Alert severity="info">Salve a promoção para ver o alcance e ligar os canais.</Alert>
      ) : (
        <>
          <Typography variant="subtitle1" gutterBottom>Alcance estimado</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }} data-testid="previa-alcance">
            {[['No público', previa?.publico], ['Receberiam o aviso na plataforma', previa?.aviso], ['Com consentimento de e-mail', previa?.emailComConsentimento]].map(([rotulo, valor]) => (
              <Paper key={rotulo} variant="outlined" sx={{ p: 1.5, minWidth: 180 }}>
                <Typography variant="caption" color="text.secondary">{rotulo}</Typography><Typography variant="h6">{valor ?? '—'}</Typography>
              </Paper>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
            Estimativa só com contagens: o painel não mostra nomes nem e-mails. A conferência é refeita no momento de cada envio.
          </Typography>

          <Typography variant="subtitle1" gutterBottom>
            Canais <Chip size="small" sx={{ ml: 1 }} label={`Envio: ${ESTADOS_ENVIO[estadoEnvio]}`} data-testid="estado-envio" />
          </Typography>
          {Object.keys(CANAIS).map((canal) => {
            const ligado = canais[canal];
            const motivo = ligado ? null : motivoCanalBloqueado(canal, { campanhaEstado: campanha.estado, chaves: dados.chaves, previa, citaBonus: !!promocao.incentivos?.citaBonus });
            const botao = (
              <Button size="small" variant="outlined" disabled={!!motivo} color={ligado ? 'warning' : 'primary'} onClick={() => setConfirmando({ canal, ligar: !ligado })}>
                {ligado ? 'Desligar' : 'Ligar'}
              </Button>
            );
            return (
              <Box key={canal} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography sx={{ minWidth: 180 }}>{CANAIS[canal]}</Typography>
                <Chip size="small" label={ligado ? 'Ligado' : 'Desligado'} color={ligado ? 'success' : 'default'} />
                {motivo ? <Tooltip title={motivo}><span>{botao}</span></Tooltip> : botao}
                {motivo && !ligado && <Typography variant="caption" color="text.secondary" data-testid={`motivo-${canal}`}>{motivo}</Typography>}
              </Box>
            );
          })}
          {!dados.chaves.email && <Alert severity="warning" sx={{ my: 1 }} data-testid="aviso-chave-email">A chave de e-mail de campanhas está desligada na configuração do sistema: o e-mail não pode ser ligado.</Alert>}
          {!dados.chaves.notificacao && <Alert severity="warning" sx={{ my: 1 }} data-testid="aviso-chave-notificacao">A chave de aviso na plataforma está desligada na configuração do sistema: o aviso não pode ser ligado.</Alert>}

          <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>Funil de promoção</Typography>
          {metricas?.funil?.semDados ? (
            <Alert severity="info" data-testid="funil-vazio">A promoção ainda não foi enviada: ligue um canal com a campanha ativa para começar a medir alcance e adesões.</Alert>
          ) : metricas && (
            <>
              <Table size="small" sx={{ mb: 1 }}>
                <TableHead><TableRow><TableCell>Etapa</TableCell><TableCell align="right">Quantidade</TableCell><TableCell align="right">Taxa sobre a etapa anterior</TableCell></TableRow></TableHead>
                <TableBody>{metricas.funil.etapas.map((e) => (
                  <TableRow key={e.etapa}><TableCell>{ETAPAS_PROMO[e.etapa]}</TableCell><TableCell align="right">{e.total}</TableCell><TableCell align="right">{percentual(e.taxaDaEtapaAnterior)}</TableCell></TableRow>
                ))}</TableBody>
              </Table>
              <Typography variant="body2" color="text.secondary" data-testid="resumo-descadastros">
                Descadastros: {metricas.funil.descadastros} · Sem consentimento de e-mail: {metricas.funil.semConsentimento} · Avisos dispensados: {metricas.funil.avisosDispensados}
              </Typography>
            </>
          )}
        </>
      )}

      <Dialog open={!!confirmando} onClose={() => setConfirmando(null)}>
        <DialogTitle>{confirmando?.ligar ? 'Ligar' : 'Desligar'} {confirmando && CANAIS[confirmando.canal]}</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmando?.ligar
              ? (confirmando.canal === 'email'
                ? `O convite sai agora para quem consentiu em receber convites de campanhas (${previa?.emailComConsentimento ?? 0} pessoas, estimativa). Cada pessoa recebe no máximo duas mensagens.`
                : 'O aviso passa a aparecer no painel de quem faz parte do público.')
              : 'Os envios pendentes são interrompidos e nada mais sai por este canal.'}
          </Typography>
          {erroCanal && <Alert severity="error" sx={{ mt: 2 }}>{erroCanal}</Alert>}
        </DialogContent>
        <DialogActions><Button onClick={() => setConfirmando(null)}>Voltar</Button><Button variant="contained" onClick={mudarCanal}>Confirmar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
