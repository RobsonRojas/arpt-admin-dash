import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, MenuItem, LinearProgress, Chip
} from '@mui/material';
import { Add, Edit, Delete, Receipt, OpenInNew } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { api } from '../../../services/api';

const CATEGORY_COLORS = {
  'Mão de Obra': '#2e7d32',   // Forest Green
  'Logística': '#0288d1',     // Sky Blue
  'Insumos': '#ed6c02',       // Vibrant Orange
  'Equipamentos': '#9c27b0',  // Amethyst Purple
  'Outros': '#757575'         // Cool Grey
};

export const ProjectSpends = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [despesas, setDespesas] = useState([]);
  const [metrics, setMetrics] = useState({
    totalSpent: 0,
    averageSpend: 0,
    faturamentoConsumido: 0,
    budget: 0,
    categoryBreakdown: []
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [editingSpend, setEditingSpend] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    responsavel: '',
    valor: '',
    data_despesa: '',
    categoria: 'Outros',
    comprovante_url: ''
  });

  useEffect(() => {
    if (projectId) {
      fetchSpends();
    }
  }, [projectId]);

  const fetchSpends = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/manejos/despesas/projeto/${projectId}`);
      if (response.data) {
        setDespesas(response.data.despesas || []);
        setMetrics(response.data.metrics || {
          totalSpent: 0,
          averageSpend: 0,
          faturamentoConsumido: 0,
          budget: 0,
          categoryBreakdown: []
        });
      }
    } catch (error) {
      console.error('Error fetching spends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (spend = null) => {
    if (spend) {
      setEditingSpend(spend);
      // Format date from YYYY-MM-DDT... to YYYY-MM-DD
      const rawDate = spend.data_despesa || '';
      const formattedDate = rawDate.split('T')[0];

      setFormData({
        nome: spend.nome || '',
        responsavel: spend.responsavel || '',
        valor: spend.valor ? String(spend.valor) : '',
        data_despesa: formattedDate,
        categoria: spend.categoria || 'Outros',
        comprovante_url: spend.comprovante_url || ''
      });
    } else {
      setEditingSpend(null);
      // Default date to today in YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        nome: '',
        responsavel: '',
        valor: '',
        data_despesa: today,
        categoria: 'Outros',
        comprovante_url: ''
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.responsavel || !formData.valor || !formData.data_despesa || !formData.categoria) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      id_projeto: Number(projectId),
      nome: formData.nome,
      responsavel: formData.responsavel,
      valor: Number(formData.valor),
      data_despesa: formData.data_despesa,
      categoria: formData.categoria,
      comprovante_url: formData.comprovante_url || null
    };

    // Basic URL validation if populated
    if (payload.comprovante_url) {
      try {
        new URL(payload.comprovante_url);
      } catch (e) {
        alert('Por favor, insira um link de comprovante válido.');
        return;
      }
    }

    try {
      if (editingSpend) {
        await api.put(`/api/v1/manejos/despesas/${editingSpend.id}`, payload);
      } else {
        await api.post('/api/v1/manejos/despesas', payload);
      }
      setOpenDialog(false);
      fetchSpends();
    } catch (error) {
      console.error('Error saving spend:', error);
      alert('Erro ao salvar despesa. Verifique as informações fornecidas.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir permanentemente este registro de despesa?')) {
      try {
        await api.delete(`/api/v1/manejos/despesas/${id}`);
        fetchSpends();
      } catch (error) {
        console.error('Error deleting spend:', error);
        alert('Erro ao excluir despesa.');
      }
    }
  };

  const formatCurrency = (val) => {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold" color="primary">Gestão de Despesas & Custos</Typography>
        <Button data-testid="despesa-add-btn" variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} sx={{ borderRadius: 2 }}>
          Nova Despesa
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* KPI Row */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary" gutterBottom>Total Despendido</Typography>
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    {formatCurrency(metrics.totalSpent)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary" gutterBottom>Ticket Médio</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    {formatCurrency(metrics.averageSpend)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary" gutterBottom>Faturamento Consumido</Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography variant="h5" fontWeight="bold" color="warning.main">
                      {metrics.faturamentoConsumido.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Teto: {formatCurrency(metrics.budget)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(metrics.faturamentoConsumido, 100)}
                    color={metrics.faturamentoConsumido > 80 ? 'error' : 'warning'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts & Table Dashboard Grid */}
          <Grid container spacing={3}>
            {/* Left Column: Donut Chart */}
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight="bold" mb={2}>Alocação por Categoria</Typography>
                
                {metrics.totalSpent === 0 ? (
                  <Box flexGrow={1} display="flex" justifyContent="center" alignItems="center" height={220}>
                    <Typography color="textSecondary" variant="body2">Sem despesas registradas.</Typography>
                  </Box>
                ) : (
                  <Box flexGrow={1} height={250} width="100%">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={metrics.categoryBreakdown.filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {metrics.categoryBreakdown.filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#757575'} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                        <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Right Column: Spends Table */}
            <Grid item xs={12} md={8}>
              <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 350 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Categoria</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Responsável</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Valor</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">Prov.</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {despesas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                            <Typography color="textSecondary" variant="body2">Nenhuma despesa operacional cadastrada.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        despesas.map((item) => (
                          <TableRow key={item.id} hover data-testid="despesa-row">
                            <TableCell>{formatDate(item.data_despesa)}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{item.nome}</TableCell>
                            <TableCell>
                              <Chip
                                label={item.categoria}
                                size="small"
                                sx={{
                                  bgcolor: `${CATEGORY_COLORS[item.categoria] || '#757575'}15`,
                                  color: CATEGORY_COLORS[item.categoria] || '#757575',
                                  fontWeight: 'bold',
                                  fontSize: '0.72rem'
                                }}
                              />
                            </TableCell>
                            <TableCell>{item.responsavel}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(item.valor)}
                            </TableCell>
                            <TableCell align="center">
                              {item.comprovante_url ? (
                                <IconButton
                                  size="small"
                                  color="primary"
                                  href={item.comprovante_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <OpenInNew fontSize="inherit" />
                                </IconButton>
                              ) : (
                                <Typography variant="caption" color="textSecondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" color="default" onClick={() => handleOpenDialog(item)}>
                                <Edit fontSize="inherit" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                                <Delete fontSize="inherit" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* CRUD Dialog Form */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          {editingSpend ? 'Editar Registro de Despesa' : 'Novo Registro de Despesa'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }} data-testid="despesa-form">
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Nome da Despesa"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              fullWidth
              required
              variant="outlined"
              placeholder="Ex: Aluguel de Roçadeiras"
            />
            <TextField
              label="Membro Responsável"
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              fullWidth
              required
              variant="outlined"
              placeholder="Ex: Carlos Silva"
            />
            <TextField
              label="Valor (R$)"
              type="number"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              fullWidth
              required
              variant="outlined"
              placeholder="0.00"
            />
            <TextField
              select
              label="Categoria"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              fullWidth
              required
              variant="outlined"
            >
              <MenuItem value="Mão de Obra">Mão de Obra</MenuItem>
              <MenuItem value="Logística">Logística</MenuItem>
              <MenuItem value="Insumos">Insumos</MenuItem>
              <MenuItem value="Equipamentos">Equipamentos</MenuItem>
              <MenuItem value="Outros">Outros</MenuItem>
            </TextField>
            <TextField
              label="Data da Despesa"
              type="date"
              value={formData.data_despesa}
              onChange={(e) => setFormData({ ...formData, data_despesa: e.target.value })}
              fullWidth
              required
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Link do Comprovante (Digital)"
              value={formData.comprovante_url}
              onChange={(e) => setFormData({ ...formData, comprovante_url: e.target.value })}
              fullWidth
              variant="outlined"
              placeholder="https://exemplo.com/comprovante.pdf"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
