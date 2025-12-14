
import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
export default function StatCard({ title, value, icon, color }) {
  return (
    <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="body2" color="textSecondary">{title}</Typography>
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
      </Box>
      <Box sx={{ p: 1, borderRadius: '50%', bgcolor: `${color}20`, color: color }}>{icon}</Box>
    </Paper>
  );
}
