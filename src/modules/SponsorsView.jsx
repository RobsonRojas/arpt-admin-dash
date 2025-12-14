
import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import { MOCK_DATA } from '../utils/constants';

export default function SponsorsView() {
  return (
    <Box>
      <Typography variant="h5" mb={3}>Patrocinadores (RWA)</Typography>
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Nível</TableCell><TableCell>Total</TableCell></TableRow></TableHead>
          <TableBody>
            {MOCK_DATA.sponsors.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.nome}</TableCell>
                <TableCell><Chip label={s.nivel} color="warning" size="small" /></TableCell>
                <TableCell>R$ {s.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
