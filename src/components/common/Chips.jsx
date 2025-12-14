import React from 'react';
import { Chip } from '@mui/material';

export const RiskChip = ({ level }) => {
  let color = 'success';
  if (level === 'Médio') color = 'warning';
  if (level === 'Alto') color = 'error';
  return <Chip label={level} color={color} size="small" variant={level === 'Baixo' ? 'outlined' : 'filled'} />;
};

export const StatusChip = ({ status }) => {
  const getColor = (s) => {
    switch(s) {
      case 'Aprovado': return 'success';
      case 'Em Análise': return 'info';
      case 'Rejeitado': return 'error';
      case 'Pendente Info': return 'warning';
      default: return 'default';
    }
  };
  return <Chip label={status} color={getColor(status)} size="small" />;
};
