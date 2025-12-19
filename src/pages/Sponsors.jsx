import React, { useState } from 'react';
import {
  Box, Typography, Button, Table, TableContainer, TableHead,
  TableRow, TableCell, TableBody, Paper, IconButton, Avatar,
  Chip, Drawer, List, ListItem, ListItemText
} from '@mui/material';
import { AccountBalanceWallet, Visibility } from '@mui/icons-material';
import { useAdmin } from '../contexts/AdminContext';

export const Sponsors = () => {
  const { sponsors } = useAdmin();
  const [selectedSponsor, setSelectedSponsor] = useState(null);

  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Gestão de Patrocinadores (RWA)
        </Typography>
        <Button variant="contained" startIcon={<AccountBalanceWallet />}>
          Nova Captação
        </Button>
      </Box>
      
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f9fafb' }}>
            <TableRow>
              <TableCell>Patrocinador</TableCell>
              <TableCell>Nível</TableCell>
              <TableCell>Total Patrocinado</TableCell>
              <TableCell align="right">Ação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sponsors.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Box display="flex" gap={2} alignItems="center">
                    <Avatar>{row.nome[0]}</Avatar>
                    <Box>
                      <Typography fontWeight="bold">{row.nome}</Typography>
                      <Typography variant="caption">{row.tipo}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={row.nivel} 
                    size="small" 
                    color={row.nivel === 'Platina' ? 'info' : 'warning'} 
                  />
                </TableCell>
                <TableCell>
                  <Typography color="success.main" fontWeight="bold">
                    R$ {row.total_patrocinado.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => setSelectedSponsor(row)}>
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Drawer Detalhes */}
      <Drawer 
        anchor="right" 
        open={Boolean(selectedSponsor)} 
        onClose={() => setSelectedSponsor(null)}
      >
        <Box p={3} width={400}>
          <Typography variant="h6">Detalhes</Typography>
          {selectedSponsor && (
            <List>
              <ListItem>
                <ListItemText 
                  primary="Nome" 
                  secondary={selectedSponsor.nome} 
                />
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};
