
import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import { MOCK_DATA } from '../utils/constants';

export default function ProjectsView() {
  return (
    <Box>
      <Typography variant="h5" mb={3}>Gestão de Projetos</Typography>
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Projeto</TableCell><TableCell>Status</TableCell><TableCell>Custo</TableCell></TableRow></TableHead>
          <TableBody>
            {MOCK_DATA.projects.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.descricao}<br/><small>{p.municipio}</small></TableCell>
                <TableCell><Chip label={p.status} color={p.status === 'Aprovado' ? 'success' : 'warning'} size="small" /></TableCell>
                <TableCell>R$ {p.custo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
