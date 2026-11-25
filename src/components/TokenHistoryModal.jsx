import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Typography, IconButton, Tooltip
} from '@mui/material';
import { Refresh, Restore, Sync } from '@mui/icons-material';
import { api } from '../services/api';

// baseURL do `api` já termina em /api
const ROTAS = { tree: 'arvores', manejo: 'manejos', propriedade: 'propriedades' };

export const TokenHistoryModal = ({ open, onClose, tokenType, tokenId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState(null);

  const fetchHistory = async () => {
    if (!tokenId || !tokenType) return;
    setLoading(true);
    try {
      const endpoint = `/${ROTAS[tokenType]}/${tokenId}/blockchain-history`;
      const response = await api.get(endpoint);
      // árvore e propriedade respondem { result, data: [...] }; manejo responde o array direto
      const corpo = response.data;
      setHistory(Array.isArray(corpo) ? corpo : (corpo?.data || []));
    } catch (error) {
      console.error('Error fetching token history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, tokenId, tokenType]);

  const handleResend = async (historyId) => {
    if (!window.confirm('Tem certeza que deseja reenviar o estado atual para corrigir este token na blockchain?')) {
      return;
    }
    
    setResendingId(historyId);
    try {
      const endpoint = `/${ROTAS[tokenType]}/${tokenId}/blockchain-history/${historyId}/resend`;
      await api.post(endpoint);
      alert('Transação enfileirada com sucesso para correção na blockchain!');
    } catch (error) {
      console.error('Error resending transaction:', error);
      alert(error.response?.data?.error || 'Erro ao reenviar a transação. Verifique o console para mais detalhes.');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Histórico de Alterações na Blockchain ({tokenType === 'tree' ? 'Árvore' : tokenType === 'propriedade' ? 'Propriedade' : 'Manejo'} #{tokenId})
        </Typography>
        <IconButton onClick={fetchHistory} disabled={loading} title="Atualizar">
          <Refresh />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress />
          </div>
        ) : history.length === 0 ? (
          <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
            Nenhum histórico encontrado para este token.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell>ID Transação</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>TXID (Blockchain)</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>#{item.id}</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
                      {item.txid ? `${item.txid.substring(0, 15)}...${item.txid.substring(item.txid.length - 15)}` : 'Pendente'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Reenviar Payload Atual">
                        <span>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleResend(item.id)}
                            disabled={resendingId === item.id || !item.txid}
                          >
                            {resendingId === item.id ? <CircularProgress size={20} /> : <Sync />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TokenHistoryModal;
