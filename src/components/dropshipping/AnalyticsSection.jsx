import React, { useEffect, useState } from 'react';
import { Alert, Card, CardContent, Grid, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { api } from '../../services/api';

// Analytics de dropshipping: funil de candidaturas, oportunidades e alertas de capacidade.
// Cada consulta é independente: se uma falhar, as outras continuam aparecendo.
const BASE = '/api/v1/admin/dropshipping/analytics';

const ETAPAS = [
  ['candidaturas', 'Candidaturas'],
  ['aprovadas', 'Aprovadas'],
  ['lojas', 'Lojas criadas'],
  ['lojas_com_produto', 'Lojas com produto'],
  ['lojas_ativas', 'Lojas ativas'],
];

const reais = (v) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AnalyticsSection() {
  const [funil, setFunil] = useState(null);
  const [oportunidades, setOportunidades] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [erros, setErros] = useState({});

  useEffect(() => {
    const pedidos = [
      ['funil', api.get(`${BASE}/funnel`).then((r) => setFunil(r.data))],
      ['oportunidades', api.get(`${BASE}/opportunities`).then((r) => setOportunidades(r.data))],
      ['alertas', api.get(`${BASE}/capacity-warnings`).then((r) => setAlertas(r.data))],
    ];
    Promise.allSettled(pedidos.map(([, p]) => p)).then((resultados) => {
      const falhas = {};
      resultados.forEach((r, i) => { if (r.status === 'rejected') falhas[pedidos[i][0]] = true; });
      setErros(falhas);
    });
  }, []);

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Funil (últimos 30 dias)</Typography>
            {erros.funil && <Alert severity="error">Não foi possível carregar o funil.</Alert>}
            {funil && (
              <Stack spacing={0.5}>
                {ETAPAS.map(([chave, rotulo]) => (
                  <Typography key={chave} variant="body2">
                    <strong>{rotulo}:</strong> {funil.etapas?.[chave] ?? 0}
                  </Typography>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Oportunidades</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Produtos ativos que nenhuma loja vende ainda.
            </Typography>
            {erros.oportunidades && <Alert severity="error">Não foi possível carregar as oportunidades.</Alert>}
            {!erros.oportunidades && oportunidades.length === 0 && (
              <Typography variant="body2">Nenhuma oportunidade no momento.</Typography>
            )}
            <List dense disablePadding>
              {oportunidades.map((p) => (
                <ListItem key={p.id} disableGutters>
                  <ListItemText primary={p.nome} secondary={reais(p.preco)} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Alertas de capacidade</Typography>
            {erros.alertas && <Alert severity="error">Não foi possível carregar os alertas.</Alert>}
            {!erros.alertas && alertas.length === 0 && (
              <Typography variant="body2">Nenhum produto no limite de capacidade.</Typography>
            )}
            <List dense disablePadding>
              {alertas.map((a) => (
                <ListItem key={a.id} disableGutters>
                  <ListItemText
                    primary={a.nome}
                    secondary={`Fila ${a.fila_atual ?? 0} de ${a.limite_fila}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
