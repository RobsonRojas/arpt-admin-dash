import React, { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../services/api';

const hoje = () => new Date().toISOString().slice(0, 10);
const diasAtras = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

/** Proporção (0 a 1) em porcentagem. `null` = sem dado, nunca 0. */
export const pct = (v) => (v === null || v === undefined ? 'sem dado' : `${(v * 100).toFixed(1).replace('.', ',')}%`);
const num = (v) => (v === null || v === undefined ? 'sem dado' : String(v).replace('.', ','));

export const GrowthIndicators = () => {
  const [de, setDe] = useState(diasAtras(30));
  const [ate, setAte] = useState(hoje());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setErro(''); setCarregando(true);
    try {
      // `ate` vai até o fim do dia escolhido.
      const r = await api.get('/admin/growth/indicadores', { params: { de: `${de}T00:00:00`, ate: `${ate}T23:59:59` } });
      setDados(r.data);
    } catch { setErro('Não foi possível carregar os indicadores.'); setDados(null); }
    finally { setCarregando(false); }
  };

  const cartoes = dados ? [
    ['Coeficiente de indicação (K)', num(dados.k), 'Convites por usuário × conversão dos convites. Acima de 1: cada usuário traz mais de um.'],
    ['Taxa de compartilhamento', pct(dados.taxaCompartilhamento), `${dados.compartilhamentos} compartilhamentos ÷ ${dados.visitas} visitas`],
    ['Conversão dos convites', pct(dados.conversaoConvite), 'Cadastros por convite ÷ aberturas de convite'],
    [`Retenção dos indicados (${dados.retencao.dias} dias)`, pct(dados.retencao.taxa), `${dados.retencao.retidos} de ${dados.retencao.elegiveis} indicados compraram depois de ${dados.retencao.dias} dias`],
  ] : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Indicadores de crescimento</Typography>
      <Typography color="text.secondary" paragraph>
        Calculados só com dados da plataforma, sem script de terceiros. Visitas sem origem (`ref`) aparecem como "direta". A medição é conservadora:
        quem volta depois sem `ref` não é atribuído à origem.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}><TextField fullWidth size="small" type="date" label="De" InputLabelProps={{ shrink: true }} value={de} onChange={(e) => setDe(e.target.value)} /></Grid>
        <Grid item xs={6} md={3}><TextField fullWidth size="small" type="date" label="Até" InputLabelProps={{ shrink: true }} value={ate} onChange={(e) => setAte(e.target.value)} /></Grid>
        <Grid item xs={12} md={3}><Button fullWidth variant="contained" disabled={!de || !ate || de > ate || carregando} onClick={carregar}>Ver indicadores</Button></Grid>
      </Grid>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
      {carregando && <CircularProgress />}

      {dados && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {cartoes.map(([rotulo, valor, nota]) => (
              <Grid item xs={12} sm={6} md={3} key={rotulo}>
                <Card variant="outlined" sx={{ height: '100%' }}><CardContent>
                  <Typography variant="h4">{valor}</Typography>
                  <Typography variant="body2">{rotulo}</Typography>
                  <Typography variant="caption" color="text.secondary">{nota}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>

          <Card variant="outlined"><CardContent>
            <Typography variant="h6" gutterBottom>Origem e conversão por origem</Typography>
            {dados.porOrigem.length === 0 ? <Typography color="text.secondary">Sem visitas, cadastros nem compras neste período.</Typography> : (
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Origem</TableCell><TableCell align="right">Visitas</TableCell><TableCell align="right">Cadastros</TableCell>
                  <TableCell align="right">Compras</TableCell><TableCell align="right">Conversão</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {dados.porOrigem.map((o) => (
                    <TableRow key={o.origem}>
                      <TableCell>{o.origem === 'direta' ? 'Direta (sem ref)' : o.origem}</TableCell>
                      <TableCell align="right">{o.visitas}</TableCell><TableCell align="right">{o.cadastros}</TableCell>
                      <TableCell align="right">{o.compras}</TableCell><TableCell align="right">{pct(o.conversao)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Conversão = (cadastros + compras) ÷ visitas da origem. {dados.observacao}
            </Typography>
          </CardContent></Card>
        </>
      )}
    </Box>
  );
};
