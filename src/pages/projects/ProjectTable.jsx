import React from 'react';
import { 
  Table, TableContainer, TableHead, TableRow, TableCell, 
  TableBody, Paper, Box, Typography, Avatar, IconButton 
} from '@mui/material';
import { Edit, Assessment, Visibility, Image as ImageIcon } from '@mui/icons-material';
import { Nature } from '@mui/icons-material';
import { StatusChip } from '../../components/StatusChip';

export const ProjectTable = ({ projects, getProjectImage, onEdit, onReport, onCarbonReport, onSelect }) => {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', display: { xs: 'none', md: 'block' } }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Projeto</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Custo</TableCell>
            <TableCell align="right">Ação</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map(p => (
            <TableRow key={p.id}>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    src={getProjectImage(p)}
                    variant="rounded"
                  >
                    <ImageIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {p.descricao}
                    </Typography>
                    <Typography variant="caption">{p.municipio} - {p.estado}</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <StatusChip status={p.desc_status} />
              </TableCell>
              <TableCell>
                R$ {parseFloat(p.custo_operacional).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => onEdit(p)}
                  title="Editar"
                  aria-label="Editar projeto"
                >
                  <Edit />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onReport(p)}
                  title="Relatório de Receitas"
                  aria-label="Relatório de Receitas"
                >
                  <Assessment />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onCarbonReport(p)}
                  title="Relatório de Carbono & ESG"
                  aria-label="Relatório de Carbono & ESG"
                >
                  <Nature color="success" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onSelect(p)}
                  title="Visualizar"
                  aria-label="Visualizar projeto"
                >
                  <Visibility />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
