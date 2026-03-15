import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Switch,
  CircularProgress, Alert, Button, Card, CardContent, Grid
} from '@mui/material';
import { CheckCircle, Person, Forest, TrendingUp } from '@mui/icons-material';
import axios from 'axios';

// Assuming API base URL is available from environment or similar to other pages
const API_BASE = '/admin/adocoes';

export const Adoptions = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adocoes, setAdocoes] = useState([]);
  const [interesses, setInteresses] = useState([]);
  const [arvores, setArvores] = useState([]);
  const [totalArvores, setTotalArvores] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, [tab, page, rowsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 0) {
        const res = await axios.get(`${API_BASE}/list`);
        setAdocoes(res.data);
      } else if (tab === 1) {
        const res = await axios.get(`${API_BASE}/list-interesses`);
        setInteresses(res.data);
      } else if (tab === 2) {
        const res = await axios.get(`${API_BASE}/arvores-gestao`, {
          params: { page: page + 1, pageSize: rowsPerPage }
        });
        setArvores(res.data.trees);
        setTotalArvores(res.data.total);
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Houve um erro ao carregar os dados. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRelease = async (id, currentStatus) => {
    try {
      await axios.patch(`${API_BASE}/arvores/${id}/liberacao`, {
        available: !currentStatus
      });
      setArvores(arvores.map(a => a.id === id ? { ...a, adoptable: !currentStatus } : a));
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      alert('Erro ao alterar status da árvore.');
    }
  };

  const totalRevenue = adocoes.reduce((acc, curr) => acc + (parseFloat(curr.paid_value) || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Gestão de Adoções
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle color="primary" />
                <Typography color="textSecondary">Adoções Ativas</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{adocoes.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingUp color="success" />
                <Typography color="textSecondary">Receita Total</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Person color="warning" />
                <Typography color="textSecondary">Interessados</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{interesses.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Adoções Realizadas" />
          <Tab label="Lista de Interessados" />
          <Tab label="Gestão do Inventário" />
        </Tabs>

        {loading && <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>}
        {error && <Box p={2}><Alert severity="error">{error}</Alert></Box>}

        {!loading && !error && (
          <Box p={2}>
            {tab === 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Árvore</TableCell>
                      <TableCell>Usuário</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adocoes.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{new Date(row.adoption_date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{row.number} - {row.popularName}</TableCell>
                        <TableCell>{row.user_email}</TableCell>
                        <TableCell>R$ {row.paid_value.toFixed(2)}</TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{
                            px: 1, py: 0.5, borderRadius: 1,
                            bgcolor: row.status === 'active' ? 'success.light' : 'grey.300',
                            color: row.status === 'active' ? 'success.contrastText' : 'text.primary'
                          }}>
                            {row.status === 'active' ? 'Ativa' : 'Expirada'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {adocoes.length === 0 && <TableRow><TableCell colSpan={5} align="center">Nenhuma adoção encontrada.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tab === 1 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data de Registro</TableCell>
                      <TableCell>Nome / Usuário</TableCell>
                      <TableCell>Email</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {interesses.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{new Date(row.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{row.full_name || 'Usuário Não Logado'}</TableCell>
                        <TableCell>{row.user_email || row.email}</TableCell>
                      </TableRow>
                    ))}
                    {interesses.length === 0 && <TableRow><TableCell colSpan={3} align="center">Ninguém demonstrou interesse ainda.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tab === 2 && (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Número</TableCell>
                        <TableCell>Nome Popular</TableCell>
                        <TableCell>Espécie</TableCell>
                        <TableCell>Disponível para Adoção</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {arvores.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.number}</TableCell>
                          <TableCell>{row.popularName}</TableCell>
                          <TableCell>{row.specieName}</TableCell>
                          <TableCell>
                            <Switch
                              checked={row.adoptable}
                              onChange={() => handleToggleRelease(row.id, row.adoptable)}
                              color="primary"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={totalArvores}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  labelRowsPerPage="Itens por página"
                />
              </>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};
