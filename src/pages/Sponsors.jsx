import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Paper, IconButton, Chip, Drawer, List, ListItem, ListItemText, Divider, MenuItem,
  Select, FormControl, InputLabel, Alert, CircularProgress
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { api } from '../services/api';

// Divisão do patrocínio por projeto (painel-divisao-patrocinios). A divisão é disparada pelo próprio proprietário;
// o admin só acompanha e consulta.
const STATUS = {
  APLICADA: { label: 'Aplicada', color: 'success' },
  PENDENTE_SEM_CONTA: { label: 'Pendente (sem conta)', color: 'warning' },
  NAO_APLICADA: { label: 'Não aplicada', color: 'default' },
  NAO_INFORMADO: { label: 'Sem status', color: 'default' },
};

const FILTROS = [{ value: '', label: 'Todos' }, ...Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))];

const reais = (v) => `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const data = (v) => (v ? new Date(v).toLocaleString('pt-BR') : '—');

const StatusChip = ({ status }) => {
  const s = STATUS[status] ?? STATUS.NAO_INFORMADO;
  return <Chip label={s.label} size="small" color={s.color} variant={s.color === 'default' ? 'outlined' : 'filled'} />;
};

export const Sponsors = () => {
  const [patrocinios, setPatrocinios] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [selecionado, setSelecionado] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    api.get('/admin/divisao', { params: filtro ? { status: filtro } : {} })
      .then((res) => { if (ativo) setPatrocinios(res.data); })
      .catch(() => { if (ativo) setErro('Não foi possível carregar os patrocínios.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [filtro]);

  const abrirDetalhes = async (item) => {
    setSelecionado(item);
    setDetalhe(null);
    try {
      const res = await api.get(`/admin/divisao/${item.id}`);
      setDetalhe(res.data);
    } catch {
      setErro('Não foi possível carregar os detalhes deste patrocínio.');
    }
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h5" fontWeight={600}>Patrocínios e divisão</Typography>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Status da divisão</InputLabel>
          <Select label="Status da divisão" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            {FILTROS.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f9fafb' }}>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Proprietário</TableCell>
              <TableCell>Projeto</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Divisão</TableCell>
              <TableCell align="right">Ação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {carregando && (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            )}
            {!carregando && patrocinios.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">Nenhum patrocínio encontrado.</TableCell></TableRow>
            )}
            {!carregando && patrocinios.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{data(p.data)}</TableCell>
                <TableCell>
                  <Typography fontWeight="bold">{p.proprietario?.nome || '—'}</Typography>
                  <Typography variant="caption">{p.proprietario?.email}</Typography>
                </TableCell>
                <TableCell>Manejo {p.projeto?.manejo_id} · recompensa {p.projeto?.produto_manejo_id}</TableCell>
                <TableCell><Typography fontWeight="bold">{reais(p.valor_total)}</Typography></TableCell>
                <TableCell><StatusChip status={p.status} /></TableCell>
                <TableCell align="right">
                  <IconButton aria-label="Detalhes" onClick={() => abrirDetalhes(p)}><Visibility /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Exibe até 200 patrocínios, do mais recente ao mais antigo.
      </Typography>

      <Drawer anchor="right" open={Boolean(selecionado)} onClose={() => { setSelecionado(null); setDetalhe(null); }}>
        <Box p={3} width={400}>
          <Typography variant="h6">Detalhes do patrocínio</Typography>
          {!detalhe && selecionado && <CircularProgress size={24} sx={{ mt: 2 }} />}
          {detalhe && (
            <List>
              <ListItem><ListItemText primary="Data" secondary={data(detalhe.data)} /></ListItem>
              <ListItem><ListItemText primary="Proprietário" secondary={`${detalhe.proprietario?.nome || '—'} · ${detalhe.proprietario?.email || '—'}`} /></ListItem>
              <ListItem><ListItemText primary="Projeto" secondary={`Manejo ${detalhe.projeto?.manejo_id} · recompensa ${detalhe.projeto?.produto_manejo_id}`} /></ListItem>
              <ListItem><ListItemText primary="Quantidade" secondary={detalhe.qtd} /></ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem><ListItemText primary="Valor pago" secondary={reais(detalhe.valor_total)} /></ListItem>
              <ListItem><ListItemText primary="Frete" secondary={reais(detalhe.frete)} /></ListItem>
              {detalhe.status === 'PENDENTE_SEM_CONTA' && (
                <>
                  <ListItem><ListItemText primary="Taxa estimada" secondary={reais(detalhe.taxa_estimada)} /></ListItem>
                  <ListItem><ListItemText primary="Repasse estimado" secondary={reais(detalhe.repasse_estimado)} /></ListItem>
                </>
              )}
              <Divider sx={{ my: 1 }} />
              <ListItem><ListItemText primary="Divisão" secondary={<StatusChip status={detalhe.status} />} /></ListItem>
              <ListItem><ListItemText primary="Transferência Stripe" secondary={detalhe.transferencia_id || '—'} /></ListItem>
            </List>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};
