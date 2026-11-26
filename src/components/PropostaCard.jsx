import React, { useState } from 'react';
import { Alert, Box, Button, Card, CardActions, CardContent, Chip, Typography } from '@mui/material';

/** Card de confirmação de escrita: mostra a ação e os parâmetros EXATOS. Só o servidor executa, com os parâmetros que gravou. */
export function PropostaCard({ proposta, onConfirmar, onRejeitar }) {
  const [estado, setEstado] = useState('pendente'); // pendente | executando | executada | recusada | erro
  const [erro, setErro] = useState('');

  const agir = async (acao) => {
    setEstado('executando'); setErro('');
    try {
      await (acao === 'confirmar' ? onConfirmar(proposta.id) : onRejeitar(proposta.id));
      setEstado(acao === 'confirmar' ? 'executada' : 'recusada');
    } catch (e) {
      setErro(e?.response?.data?.error ?? e?.message ?? 'Falha ao processar a proposta.');
      setEstado('erro');
    }
  };
  const aberta = estado === 'pendente' || estado === 'erro';

  return (
    <Card variant="outlined" sx={{ my: 1, borderColor: 'warning.main' }} data-testid="proposta-card">
      <CardContent>
        <Chip size="small" color="warning" label="Proposta (nada foi alterado ainda)" sx={{ mb: 1 }} />
        <Typography variant="subtitle1" fontWeight={600}>{proposta.resumo}</Typography>
        <Typography variant="caption" color="text.secondary">Ação: {proposta.tool}</Typography>
        <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1, fontSize: 12, overflow: 'auto' }}>{JSON.stringify(proposta.args, null, 2)}</Box>
        {estado === 'executada' && <Alert severity="success">Executada.</Alert>}
        {estado === 'recusada' && <Alert severity="info">Recusada.</Alert>}
        {estado === 'erro' && <Alert severity="error">{erro}</Alert>}
      </CardContent>
      {aberta && (
        <CardActions>
          <Button variant="contained" color="warning" onClick={() => agir('confirmar')}>Confirmar</Button>
          <Button onClick={() => agir('rejeitar')}>Rejeitar</Button>
        </CardActions>
      )}
    </Card>
  );
}
