import React, { useEffect, useState } from 'react';
import { Alert, Card, CardContent, CircularProgress, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { api } from '../services/api';
import { contagem, ESTADOS, idCurto, motivosOrdenados, resumoMotivos, totalIndicacoes } from '../utils/referralReview';

/**
 * Revisão das indicações no período (growth-referral-review-expiry): quantas há em cada estado, por que as bloqueadas foram barradas e
 * quais indicadores acumulam muitos bloqueios. Só leitura. O servidor não devolve e-mail, CPF, nome nem dispositivo, só agregados e o
 * identificador interno do indicador.
 */
export const ReferralReview = ({ de, ate, versao }) => {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // `versao` muda a cada clique em "Ver indicadores" da página: a revisão acompanha o mesmo período.
  useEffect(() => {
    let ativo = true;
    setCarregando(true); setErro('');
    api.get('/admin/growth/indicacoes/revisao', { params: { de: `${de}T00:00:00`, ate: `${ate}T23:59:59` } })
      .then((r) => { if (ativo) setDados(r.data); })
      .catch(() => { if (ativo) { setErro('Não foi possível carregar a revisão das indicações.'); setDados(null); } })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [de, ate, versao]);

  return (
    <Card variant="outlined" sx={{ mt: 2 }}><CardContent>
      <Typography variant="h6" gutterBottom>Revisão das indicações</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Só para conferir padrões antes de qualquer decisão sobre recompensa. Nada aqui libera, paga ou bloqueia ninguém.
      </Typography>
      {erro && <Alert severity="error">{erro}</Alert>}
      {carregando && <CircularProgress size={24} />}
      {dados && !carregando && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {ESTADOS.map(([chave, rotulo, nota]) => (
              <Grid item xs={6} md={3} key={chave}>
                <Card variant="outlined" sx={{ height: '100%' }}><CardContent>
                  <Typography variant="h4" data-estado={chave}>{contagem(dados.porEstado?.[chave])}</Typography>
                  <Typography variant="body2">{rotulo}</Typography>
                  <Typography variant="caption" color="text.secondary">{nota}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>
          {totalIndicacoes(dados.porEstado) === 0 && <Typography color="text.secondary">Nenhuma indicação criada neste período.</Typography>}

          <Typography variant="subtitle1" gutterBottom>Motivos de bloqueio</Typography>
          {motivosOrdenados(dados.bloqueadasPorMotivo).length === 0 ? <Typography color="text.secondary" paragraph>Nenhuma indicação bloqueada neste período.</Typography> : (
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead><TableRow><TableCell>Motivo</TableCell><TableCell align="right">Bloqueios</TableCell></TableRow></TableHead>
              <TableBody>
                {motivosOrdenados(dados.bloqueadasPorMotivo).map((m) => (
                  <TableRow key={m.motivo}><TableCell>{m.rotulo}</TableCell><TableCell align="right">{m.n}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Typography variant="subtitle1" gutterBottom>Indicadores com muitos bloqueios</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Indicadores com {dados.limite} bloqueios ou mais no período (mostra até 50). O identificador é o interno do usuário; nenhum dado pessoal aparece aqui.
          </Typography>
          {(dados.indicadoresComBloqueios ?? []).length === 0 ? <Typography color="text.secondary">Nenhum indicador acima do limite neste período.</Typography> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Indicador</TableCell><TableCell align="right">Bloqueios</TableCell><TableCell>Por motivo</TableCell></TableRow></TableHead>
              <TableBody>
                {dados.indicadoresComBloqueios.map((i) => (
                  <TableRow key={i.indicadorId}>
                    <TableCell title={i.indicadorId}><code>{idCurto(i.indicadorId)}</code></TableCell>
                    <TableCell align="right">{i.bloqueios}</TableCell>
                    <TableCell>{resumoMotivos(i.porMotivo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </CardContent></Card>
  );
};
