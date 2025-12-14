import React from 'react';
import { Grid, Paper, Typography, Box, LinearProgress } from '@mui/material';
import { Landscape, MonetizationOn, Assignment, Verified } from '@mui/icons-material';
import StatCard from '../common/StatCard';

const DashboardView = ({ stats, projects }) => {
  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Área Total" value={`${stats.area} ha`} subtext="Sob Gestão" color="#2e7d32" icon={<Landscape />} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Investimento" value={`R$ ${stats.investimento}`} subtext="Total" color="#0288d1" icon={<MonetizationOn />} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Pendências" value={stats.pendentes} subtext="Projetos" color="#ed6c02" icon={<Assignment />} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="RWA Ativos" value={stats.aprovados} subtext="Tokenizados" color="#9c27b0" icon={<Verified />} /></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6">Pipeline de Aprovação</Typography>
            <Box sx={{ my: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" fontWeight="bold">Em Análise Técnica</Typography>
                  <Typography variant="body2">{projects.filter(p=>p.status==='Em Análise').length} Projetos</Typography>
                </Box>
                <LinearProgress variant="determinate" value={50} color="warning" sx={{ height: 8, borderRadius: 5 }} />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" fontWeight="bold">Aprovados / On-chain</Typography>
                  <Typography variant="body2">{projects.filter(p=>p.status==='Aprovado').length} Projetos</Typography>
                </Box>
                <LinearProgress variant="determinate" value={25} color="success" sx={{ height: 8, borderRadius: 5 }} />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
export default DashboardView;
