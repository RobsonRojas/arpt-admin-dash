import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, Chip, Divider, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { api } from '../../services/api';
import MotivoDialog from './MotivoDialog';

// Ciclo de vida do dropshipper: aprovar, recusar, suspender e reativar, mais o histórico de decisões.
// Cada ação altera estado no backend; por isso pede confirmação, e as que exigem motivo usam MotivoDialog.
const ROTA = (userId) => `/api/v1/admin/dropshipping/profiles/${userId}`;

const STATUS_LABEL = {
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovado',
  REJEITADA: 'Recusado',
  SUSPENSA: 'Suspenso',
};

export default function LifecycleCard({ userId, status, onChanged }) {
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [acaoMotivo, setAcaoMotivo] = useState(null); // 'reject' | 'suspend' | null

  const carregarHistorico = useCallback(async () => {
    try {
      const { data } = await api.get(`${ROTA(userId)}/history`);
      setHistorico(data);
    } catch (err) {
      setErro('Não foi possível carregar o histórico. ' + (err.response?.data?.message || err.message));
    }
  }, [userId]);

  useEffect(() => { carregarHistorico(); }, [carregarHistorico]);

  const executar = async (acao, corpo) => {
    setEnviando(true);
    setErro('');
    try {
      await api.post(`${ROTA(userId)}/${acao}`, corpo);
      setAcaoMotivo(null);
      await carregarHistorico();
      onChanged?.();
    } catch (err) {
      setErro('Ação não realizada. ' + (err.response?.data?.message || err.message));
    } finally {
      setEnviando(false);
    }
  };

  const confirmar = (texto, acao) => {
    if (window.confirm(texto)) executar(acao);
  };

  const podeAprovar = status === 'PENDENTE';
  const podeRecusar = status === 'PENDENTE';
  const podeSuspender = status === 'APROVADA';
  const podeReativar = status === 'SUSPENSA';

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6">Ciclo de vida</Typography>
          <Chip label={STATUS_LABEL[status] ?? status ?? 'Sem perfil'} size="small" />
        </Stack>

        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
          {podeAprovar && (
            <Button variant="contained" color="success" disabled={enviando}
              onClick={() => confirmar('Aprovar esta candidatura de dropshipper?', 'approve')}>
              Aprovar
            </Button>
          )}
          {podeRecusar && (
            <Button variant="outlined" color="error" disabled={enviando} onClick={() => setAcaoMotivo('reject')}>
              Recusar
            </Button>
          )}
          {podeSuspender && (
            <Button variant="outlined" color="error" disabled={enviando} onClick={() => setAcaoMotivo('suspend')}>
              Suspender dropshipper
            </Button>
          )}
          {podeReativar && (
            <Button variant="contained" color="success" disabled={enviando}
              onClick={() => confirmar('Reativar este dropshipper? As lojas dele voltam pausadas.', 'reinstate')}>
              Reativar dropshipper
            </Button>
          )}
        </Stack>

        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" gutterBottom>Histórico de decisões</Typography>
        {historico.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nenhuma decisão registrada.</Typography>
        ) : (
          <List dense disablePadding>
            {historico.map((h) => (
              <ListItem key={h.id} disableGutters>
                <ListItemText
                  primary={`${STATUS_LABEL[h.status_novo] ?? h.status_novo}${h.motivo ? ` — ${h.motivo}` : ''}`}
                  secondary={h.created_at ? new Date(h.created_at).toLocaleString('pt-BR') : ''}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>

      <MotivoDialog
        open={acaoMotivo === 'reject'}
        titulo="Recusar candidatura"
        descricao="O candidato recebe este motivo por e-mail."
        textoConfirmar="Recusar"
        enviando={enviando}
        onClose={() => setAcaoMotivo(null)}
        onConfirm={(motivo) => executar('reject', { motivo })}
      />
      <MotivoDialog
        open={acaoMotivo === 'suspend'}
        titulo="Suspender dropshipper"
        descricao="Todas as lojas do dropshipper ficam suspensas. O dropshipper recebe este motivo por e-mail."
        textoConfirmar="Suspender"
        enviando={enviando}
        onClose={() => setAcaoMotivo(null)}
        onConfirm={(motivo) => executar('suspend', { motivo })}
      />
    </Card>
  );
}
