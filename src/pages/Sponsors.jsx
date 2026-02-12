import React, { useState } from 'react';
import {
  Box, Typography, Button, Table, TableContainer, TableHead,
  TableRow, TableCell, TableBody, Paper, IconButton, Avatar,
  Chip, Drawer, List, ListItem, ListItemText, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import { AccountBalanceWallet, Visibility, Add } from '@mui/icons-material';
import { useAdmin } from '../contexts/AdminContext';
import { usePersistence } from '../hooks/usePersistence';

export const Sponsors = () => {
  const { sponsors } = useAdmin();
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [openForm, setOpenForm] = useState(false);

  // Persistence
  const [persistenceKey, setPersistenceKey] = useState('sponsor_draft_new');
  const [formData, setFormData, clearDraft] = usePersistence(persistenceKey, {
    nome: '',
    nivel: 'Bronze',
    total_patrocinado: 0,
    tipo: 'Empresa'
  });

  const handleOpenNew = () => {
    setPersistenceKey('sponsor_draft_new');
    setFormData({
      nome: '',
      nivel: 'Bronze',
      total_patrocinado: 0,
      tipo: 'Empresa'
    });
    setOpenForm(true);
  };

  const handleSave = () => {
    // Mock save
    console.log("Saving sponsor", formData);
    clearDraft();
    setOpenForm(false);
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Gestão de Patrocinadores (RWA)
        </Typography>
        <Box display="flex" gap={2}>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenNew}>
            Nova Captação
          </Button>
        </Box>
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

      {/* Persistence Form Dialog */}
      < Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth >
        <DialogTitle>Novo Patrocinador</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} pt={1}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nome" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Nível" value={formData.nivel} onChange={e => setFormData({ ...formData, nivel: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Tipo" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="number" label="Total Patrocinado" value={formData.total_patrocinado} onChange={e => setFormData({ ...formData, total_patrocinado: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Salvar</Button>
        </DialogActions>
      </Dialog >
    </Box >
  );
};
