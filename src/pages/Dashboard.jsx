import React from 'react';
import { Grid } from '@mui/material';
import { Landscape, MonetizationOn, Assignment, Verified } from '@mui/icons-material';
import { StatCard } from '../components';
import { useAdmin } from '../contexts/AdminContext';

export const Dashboard = () => {
  const { getDashboardStats } = useAdmin();
  const stats = getDashboardStats();

  return (
    <Grid container spacing={3} sx={{ animation: 'fadeIn 0.5s' }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Área Total" 
          value={`${stats.area} ha`} 
          subtext="Sob Gestão" 
          color="#2e7d32" 
          icon={<Landscape />} 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Investimento" 
          value={`R$ ${stats.investimento.toLocaleString()}`} 
          subtext="Total" 
          color="#0288d1" 
          icon={<MonetizationOn />} 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="Pendências" 
          value={stats.pendentes} 
          subtext="Projetos" 
          color="#ed6c02" 
          icon={<Assignment />} 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard 
          title="RWA Ativos" 
          value={stats.aprovados} 
          subtext="Tokenizados" 
          color="#9c27b0" 
          icon={<Verified />} 
        />
      </Grid>
    </Grid>
  );
};
