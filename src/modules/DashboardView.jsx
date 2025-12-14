
import React from 'react';
import { Grid } from '@mui/material';
import { Landscape, MonetizationOn, Assignment, Verified } from '@mui/icons-material';
import StatCard from '../components/StatCard';

export default function DashboardView() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}><StatCard title="Área Preservada" value="1,650 ha" color="#2e7d32" icon={<Landscape />} /></Grid>
      <Grid item xs={12} md={3}><StatCard title="Investimento" value="R$ 205k" color="#0288d1" icon={<MonetizationOn />} /></Grid>
      <Grid item xs={12} md={3}><StatCard title="Pendentes" value="3" color="#ed6c02" icon={<Assignment />} /></Grid>
      <Grid item xs={12} md={3}><StatCard title="RWA Ativos" value="12" color="#9c27b0" icon={<Verified />} /></Grid>
    </Grid>
  );
}
