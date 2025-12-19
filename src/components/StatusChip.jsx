import React from 'react';
import { Chip } from '@mui/material';

export const StatusChip = ({ status }) => {
  const getColor = (s) => {
    if (!s) return 'default';
    if (s.includes('Ativo') || s.includes('Aprovado') || s === 'Regular' || s.includes('Concluído')) return 'success';
    if (s.includes('breve') || s.includes('Análise') || s === 'Ouro' || s === 'Pendente') return 'warning';
    if (s.includes('Suspenso') || s.includes('Cancelado') || s.includes('Reprovado') || s === 'Irregular') return 'error';
    return 'default';
  };
  
  return <Chip label={status} color={getColor(status)} size="small" />;
};
