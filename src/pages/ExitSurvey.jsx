import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, CircularProgress, FormControlLabel, Grid, MenuItem, TextField, Typography,
} from '@mui/material';
import { Download, AutoAwesome } from '@mui/icons-material';
import { api } from '../services/api';

const ROTULOS = {
  INFO_INSUFICIENTE: 'Faltou informação',
  PRECO: 'Preço',
  PRODUTO_POUCO_INTERESSANTE: 'Produto pouco interessante',
  RECOMPENSAS_POUCO_ATRAENTES: 'Recompensas pouco atraentes',
  VALOR_RECOMPENSA: 'Valor da recompensa',
  DESCONFIANCA: 'Desconfiança na campanha',
  FRETE_PRAZO: 'Frete ou prazo',
  MOMENTO_INADEQUADO: 'Momento inadequado',
  OUTRO: 'Outro',
};

export const ExitSurvey = () => {
  const [projetos, setProjetos] = useState([]);
  const [idManejo, setIdManejo] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [incluirTextos, setIncluirTextos] = useState(false);
  const [analise, setAnalise] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/manejos').then((r) => setProjetos(Array.isArray(r.data) ? r.data : [])).catch(() => setErro('Não foi possível listar os projetos.'));
  }, []);

  const filtro = () => ({ idManejo, ...(de ? { de } : {}), ...(ate ? { ate } : {}) });

  const carregar = async () => {
    setErro(''); setAnalise(null); setCarregando(true);
    try {
      const r = await api.get('/admin/pesquisa-saida/resumo', { params: filtro() });
      setResumo(r.data);
    } catch { setErro('Não foi possível carregar os resultados.'); setResumo(null); }
    finally { setCarregando(false); }
  };

  const exportar = async () => {
    setErro(''); setExportando(true);
    try {
      const r = await api.get('/admin/pesquisa-saida/exportacao.csv', { params: filtro(), responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url; a.download = `pesquisa-saida-${idManejo}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { setErro('Não foi possível exportar.'); }
    finally { setExportando(false); }
  };

  // Só roda por clique: abrir a página nunca envia dados à IA.
  const analisar = async () => {
    setErro(''); setAnalisando(true);
    try {
      const r = await api.post('/admin/pesquisa-saida/analise', { filtro: { ...filtro(), idManejo: Number(idManejo) }, incluirTextos }, { timeout: 60 * 1000 });
      setAnalise(r.data);
    } catch (e) {
      setErro(e?.response?.status === 503 ? 'A IA está desabilitada.' : 'Análise por IA indisponível.');
    } finally { setAnalisando(false); }
  };

  const motivos = resumo ? Object.entries(resumo.motivos).sort((a, b) => b[1] - a[1]) : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Pesquisa de saída</Typography>
      <Typography color="text.secondary" paragraph>
        Por que visitantes não apoiaram a campanha. A amostra é viesada: só responde quem ainda estava na página e quis responder.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={5}>
          <TextField select fullWidth size="small" label="Projeto" value={idManejo} onChange={(e) => { setIdManejo(e.target.value); setResumo(null); setAnalise(null); }}>
            {projetos.map((p) => <MenuItem key={p.id} value={p.id}>{p.nome || `Projeto ${p.id}`}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={6} md={2}><TextField fullWidth size="small" type="date" label="De" InputLabelProps={{ shrink: true }} value={de} onChange={(e) => setDe(e.target.value)} /></Grid>
        <Grid item xs={6} md={2}><TextField fullWidth size="small" type="date" label="Até" InputLabelProps={{ shrink: true }} value={ate} onChange={(e) => setAte(e.target.value)} /></Grid>
        <Grid item xs={12} md={3}><Button fullWidth variant="contained" disabled={!idManejo || carregando} onClick={carregar}>Ver resultados</Button></Grid>
      </Grid>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
      {carregando && <CircularProgress />}

      {resumo && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              ['Respostas', resumo.total],
              ['Com e-mail', resumo.comEmail],
              ['Autorizam novidades do projeto', resumo.autorizacoes.projeto],
              ['Autorizam novidades de outros projetos', resumo.autorizacoes.outrosProjetos],
            ].map(([rotulo, valor]) => (
              <Grid item xs={6} md={3} key={rotulo}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="h4">{valor}</Typography>
                  <Typography variant="body2" color="text.secondary">{rotulo}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>

          <Card variant="outlined" sx={{ mb: 2 }}><CardContent>
            <Typography variant="h6" gutterBottom>Motivos</Typography>
            {motivos.length === 0 && <Typography color="text.secondary">Sem motivos marcados.</Typography>}
            {motivos.map(([m, n]) => (
              <Box key={m} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <span>{ROTULOS[m] || m}</span><strong>{n}</strong>
              </Box>
            ))}
          </CardContent></Card>

          <Card variant="outlined" sx={{ mb: 2 }}><CardContent>
            <Typography variant="h6" gutterBottom>Por recompensa</Typography>
            {Object.entries(resumo.porRecompensa).map(([rec, mot]) => (
              <Box key={rec} sx={{ mb: 1 }}>
                <Typography variant="subtitle2">{rec === 'projeto' ? 'Página do projeto' : `Recompensa #${rec}`}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {Object.entries(mot).map(([m, n]) => `${ROTULOS[m] || m}: ${n}`).join(' · ') || 'Sem motivos marcados'}
                </Typography>
              </Box>
            ))}
          </CardContent></Card>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
            <Button variant="outlined" startIcon={<Download />} disabled={exportando} onClick={exportar}>Exportar CSV completo</Button>
            <Button variant="contained" startIcon={<AutoAwesome />} disabled={analisando || resumo.total === 0} onClick={analisar}>Analisar com IA</Button>
            <FormControlLabel
              control={<Checkbox checked={incluirTextos} onChange={(e) => setIncluirTextos(e.target.checked)} />}
              label="Incluir textos livres (dados pessoais removidos antes do envio)"
            />
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            O CSV contém e-mails: é dado pessoal. Cada exportação é registrada (quem, quando, filtro). A análise por IA nunca envia e-mail; sem a caixa acima, só vão as contagens.
          </Typography>
        </>
      )}

      {analisando && <CircularProgress />}
      {analise && (
        <Card variant="outlined"><CardContent>
          <Typography variant="h6" gutterBottom>Análise por IA</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Gerada em {analise.geradoEm ? new Date(analise.geradoEm).toLocaleString('pt-BR') : '—'} · projeto {analise.filtro?.idManejo}
            {analise.filtro?.de ? ` · de ${analise.filtro.de}` : ''}{analise.filtro?.ate ? ` · até ${analise.filtro.ate}` : ''}
            {analise.incluiuTextos ? ' · com textos livres' : ' · só contagens'} · não é gravada no sistema
          </Typography>
          <Typography component="div" sx={{ whiteSpace: 'pre-wrap' }}>{analise.analysis || analise.message}</Typography>
        </CardContent></Card>
      )}
    </Box>
  );
};
