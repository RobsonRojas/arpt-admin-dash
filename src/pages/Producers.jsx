import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { mensagemDeErro } from '../utils/adminProducers';

const LIMITE = 20;

/** Produtores na gestão de dropshipping: lista paginada com busca; abre o detalhe do produtor. */
export function Producers() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const { data } = await api.get('/api/v1/admin/producers', { params: { q: q || undefined, page, limit: LIMITE } });
      setDados(data);
    } catch (err) {
      setDados(null);
      setErro(mensagemDeErro(err, 'Não foi possível carregar os produtores.'));
    } finally {
      setCarregando(false);
    }
  }, [q, page]);

  useEffect(() => { carregar(); }, [carregar]);

  const buscar = (e) => { e.preventDefault(); setPage(1); setQ(busca.trim()); };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Produtores</Typography>
          <Typography variant="body2" color="textSecondary">Veja e edite os produtores, cadastre produtos em nome deles e importe produtos de projetos de financiamento coletivo.</Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/dropshipping-admin')}>Voltar à gestão de dropshipping</Button>
      </Box>

      <Box component="form" onSubmit={buscar} sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField size="small" label="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} sx={{ minWidth: 280 }} />
        <Button type="submit" variant="contained">Buscar</Button>
      </Box>

      {erro && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={carregar}>Tentar de novo</Button>}>{erro}</Alert>}
      {carregando && <Box display="flex" justifyContent="center" py={6}><CircularProgress aria-label="Carregando produtores" /></Box>}

      {!carregando && dados && (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Produtor</TableCell><TableCell>E-mail</TableCell>
                  <TableCell align="center">Produtos</TableCell><TableCell align="center">Ativos</TableCell><TableCell align="center">Sem dados de frete</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dados.data.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Nenhum produtor encontrado.</TableCell></TableRow>
                )}
                {dados.data.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{p.nome}{!p.is_active && <Chip label="inativo" size="small" sx={{ ml: 1 }} />}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell align="center">{p.produtos_total}</TableCell>
                    <TableCell align="center">{p.produtos_ativos}</TableCell>
                    <TableCell align="center">{p.produtos_sem_frete > 0 ? <Chip size="small" color="warning" label={p.produtos_sem_frete} /> : 0}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => navigate(`/dropshipping-admin/produtores/${p.id}`)} aria-label={`Ver detalhes de ${p.nome}`}>Detalhes</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div" count={dados.total} page={page - 1} rowsPerPage={LIMITE} rowsPerPageOptions={[LIMITE]}
            onPageChange={(_, p) => setPage(p + 1)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </Paper>
      )}
    </Box>
  );
}

export default Producers;
