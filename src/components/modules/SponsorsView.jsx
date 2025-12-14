import React, { useState } from 'react';
import { Box, Button, Typography, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Avatar, Chip, IconButton, Drawer, List, ListItem, ListItemText, Divider } from '@mui/material';
import { AccountBalanceWallet, Visibility, EmojiEvents } from '@mui/icons-material';
import { MOCK_SPONSORS } from '../../utils/constants';

const SponsorsView = () => {
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const getNivelColor = (nivel) => (nivel === 'Platina' ? 'info' : 'warning');

  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>Gestão de Patrocinadores (RWA)</Typography>
        <Button variant="contained" startIcon={<AccountBalanceWallet />}>Nova Captação</Button>
      </Box>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f9fafb' }}>
            <TableRow><TableCell>Patrocinador</TableCell><TableCell>Nível</TableCell><TableCell>Total Patrocinado</TableCell><TableCell align="right">Ação</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {MOCK_SPONSORS.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell><Box display="flex" gap={2} alignItems="center"><Avatar>{row.nome[0]}</Avatar><Box><Typography fontWeight="bold">{row.nome}</Typography><Typography variant="caption">{row.tipo}</Typography></Box></Box></TableCell>
                <TableCell><Chip label={row.nivel} size="small" color={getNivelColor(row.nivel)} icon={<EmojiEvents sx={{fontSize:16}}/>} /></TableCell>
                <TableCell><Typography color="success.main" fontWeight="bold">R$ {row.total_patrocinado.toLocaleString()}</Typography></TableCell>
                <TableCell align="right"><IconButton onClick={() => setSelectedSponsor(row)}><Visibility /></IconButton></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Drawer anchor="right" open={Boolean(selectedSponsor)} onClose={() => setSelectedSponsor(null)}>
          <Box p={3} width={400}>
              <Typography variant="h6">Detalhes</Typography>
              {selectedSponsor && (
                  <List>
                      <ListItem><ListItemText primary="Nome" secondary={selectedSponsor.nome} /></ListItem>
                      <ListItem><ListItemText primary="Contato" secondary={selectedSponsor.contato} /></ListItem>
                      <Divider />
                      <Typography variant="subtitle2" sx={{mt:2}}>Portfolio</Typography>
                      {selectedSponsor.portfolio.map((p, i) => (<ListItem key={i}><ListItemText primary={p.projeto} secondary={`R$ ${p.valor.toLocaleString()} - ${p.status}`} /></ListItem>))}
                  </List>
              )}
          </Box>
      </Drawer>
    </Box>
  );
};
export default SponsorsView;
