import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress, Alert } from '@mui/material';
import { AutoGraph } from '@mui/icons-material';
import { api } from '../services/api';

export const AnalyticsDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics/dashboard');
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados analíticos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      setLoadingInsights(true);
      const response = await api.post('/analytics/insights', data);
      if (response.data && response.data.insights) {
        setInsights(response.data.insights);
      }
    } catch (err) {
      setError('Erro ao gerar insights com IA.');
      console.error(err);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <Box sx={{ p: 3, animation: 'fadeIn 0.5s' }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Analítico
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Desempenho de Produtos
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Produto</TableCell>
                  <TableCell align="right">Compras</TableCell>
                  <TableCell align="right">Receita Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.product_id}>
                    <TableCell>{row.product_id}</TableCell>
                    <TableCell>{row.product_name}</TableCell>
                    <TableCell align="right">{row.purchases}</TableCell>
                    <TableCell align="right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">Nenhum dado encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          color="secondary" 
          startIcon={<AutoGraph />}
          onClick={generateInsights}
          disabled={loadingInsights || data.length === 0}
        >
          {loadingInsights ? 'Gerando...' : 'Gerar Insights IA'}
        </Button>
      </Box>

      {insights.length > 0 && (
        <Paper sx={{ p: 2, backgroundColor: '#f3e5f5' }}>
          <Typography variant="h6" gutterBottom color="secondary">
            Recomendações da IA (ARPT-AI)
          </Typography>
          <ul>
            {insights.map((insight, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                <Typography variant="body1">{insight}</Typography>
              </li>
            ))}
          </ul>
        </Paper>
      )}
    </Box>
  );
};
