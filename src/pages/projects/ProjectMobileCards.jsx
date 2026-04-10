import React from 'react';
import { Box, Paper, Typography, Avatar, Button, Grid, Divider } from '@mui/material';
import { Visibility, Edit, Assessment, Image as ImageIcon } from '@mui/icons-material';
import { Nature } from '@mui/icons-material';
import { StatusChip } from '../../components/StatusChip';

export const ProjectMobileCards = ({ projects, getProjectImage, onEdit, onReport, onCarbonReport, onSelect }) => {
  return (
    <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
      {projects.map((p) => (
        <Paper key={p.id} sx={{ p: 2, borderRadius: 2, elevation: 2 }}>
          <Box display="flex" gap={2} alignItems="center" mb={1}>
            <Avatar
              src={getProjectImage(p)}
              variant="rounded"
              sx={{ width: 64, height: 64 }}
            >
              <ImageIcon />
            </Avatar>
            <Box flex={1}>
              <Typography fontWeight="bold" variant="subtitle1">{p.descricao}</Typography>
              <Typography variant="body2" color="textSecondary">{p.municipio} - {p.estado}</Typography>
              <Box mt={0.5}>
                <StatusChip status={p.desc_status} size="small" />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Grid container spacing={1} alignItems="center">
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary" display="block">Custo Operacional</Typography>
              <Typography variant="body2" fontWeight="bold">
                R$ {parseFloat(p.custo_operacional).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Typography>
            </Grid>
            <Grid item xs={6} display="flex" justifyContent="flex-end" gap={0.5}>
               <Button size="small" variant="outlined" onClick={() => onReport(p)} title="Relatório">
                  <Assessment fontSize="small" />
               </Button>
               <Button size="small" variant="outlined" color="success" onClick={() => onCarbonReport(p)} title="Carbono">
                  <Nature fontSize="small" />
               </Button>
            </Grid>
          </Grid>

          <Box display="flex" gap={1} mt={2}>
            <Button 
                fullWidth 
                variant="outlined" 
                size="small" 
                startIcon={<Visibility />} 
                onClick={() => onSelect(p)}
            >
              Ver Detalhes
            </Button>
            <Button 
                fullWidth 
                variant="contained" 
                size="small" 
                startIcon={<Edit />} 
                onClick={() => onEdit(p)}
            >
              Editar
            </Button>
          </Box>
        </Paper>
      ))}
      {projects.length === 0 && (
        <Typography align="center" color="textSecondary" sx={{ py: 4 }}>Nenhum projeto encontrado</Typography>
      )}
    </Box>
  );
};
