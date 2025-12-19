import React, { useState } from 'react';
import {
  Box, Typography, Button, Table, TableContainer, TableHead, 
  TableRow, TableCell, TableBody, Paper, IconButton, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, 
  TextField, MenuItem, Drawer, Divider, List, ListItem, ListItemText
} from '@mui/material';
import { Add, Visibility, Edit, CloudUpload, HomeWork } from '@mui/icons-material';
import { StatusChip, MapEmbed } from '../components';
import { STATUS_PROPRIEDADE } from '../constants';
import { useAdmin } from '../contexts/AdminContext';

export const Properties = () => {
  const { properties, handleAddProperty, handleUpdateProperty } = useAdmin();
  
  const [openForm, setOpenForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProp, setSelectedProp] = useState(null);
  
  const [formData, setFormData] = useState({
    id: '', 
    proprietario: '', 
    car: '', 
    municipio: '', 
    area: '', 
    status: 'Regular', 
    foto: '', 
    lat: '', 
    lng: ''
  });

  const handleOpenNew = () => {
    setFormData({ 
      id: '', 
      proprietario: '', 
      car: '', 
      municipio: '', 
      area: '', 
      status: 'Regular', 
      foto: '', 
      lat: '', 
      lng: '' 
    });
    setIsEditing(false);
    setOpenForm(true);
  };

  const handleOpenEdit = (prop) => {
    setFormData({
      id: prop.id, 
      proprietario: prop.proprietario, 
      car: prop.car, 
      municipio: prop.municipio, 
      area: prop.area, 
      status: prop.status, 
      foto: prop.foto, 
      lat: prop.coords.lat, 
      lng: prop.coords.lng
    });
    setIsEditing(true);
    setOpenForm(true);
  };

  const handleUploadPhoto = () => {
    setFormData({ 
      ...formData, 
      foto: `https://picsum.photos/200?random=${Math.floor(Math.random() * 1000)}` 
    });
  };

  const handleSave = () => {
    if (!formData.proprietario || !formData.car) {
      alert("Preencha os campos obrigatórios");
      return;
    }
    
    if (isEditing) {
      handleUpdateProperty(formData);
    } else {
      handleAddProperty(formData);
    }
    
    setOpenForm(false);
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center" gap={1}>
          <HomeWork color="primary" /> Gestão de Propriedades
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleOpenNew}
        >
          Cadastrar Propriedade
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f9fafb' }}>
            <TableRow>
              <TableCell>Propriedade / CAR</TableCell>
              <TableCell>Município</TableCell>
              <TableCell>Área (ha)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {properties.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar src={row.foto} variant="rounded">
                      {row.proprietario[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {row.proprietario}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {row.car}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{row.municipio}</TableCell>
                <TableCell>{row.area}</TableCell>
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => setSelectedProp(row)} 
                    title="Visualizar"
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="default" 
                    onClick={() => handleOpenEdit(row)} 
                    title="Editar"
                  >
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Dialog Form */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Propriedade' : 'Nova Propriedade'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} pt={1}>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Nome do Proprietário" 
                value={formData.proprietario} 
                onChange={e => setFormData({...formData, proprietario: e.target.value})} 
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth 
                label="Número CAR" 
                value={formData.car} 
                onChange={e => setFormData({...formData, car: e.target.value})} 
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth 
                label="Município" 
                value={formData.municipio} 
                onChange={e => setFormData({...formData, municipio: e.target.value})} 
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth 
                type="number" 
                label="Área Total (ha)" 
                value={formData.area} 
                onChange={e => setFormData({...formData, area: e.target.value})} 
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                select 
                fullWidth 
                label="Status" 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                {STATUS_PROPRIEDADE.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Box 
                display="flex" 
                alignItems="center" 
                gap={2} 
                mt={1} 
                p={2} 
                border="1px dashed #ccc" 
                borderRadius={2}
              >
                {formData.foto ? (
                  <Avatar 
                    src={formData.foto} 
                    sx={{ width: 56, height: 56 }} 
                    variant="rounded" 
                  />
                ) : (
                  <Typography color="textSecondary">Sem foto</Typography>
                )}
                <Button 
                  variant="outlined" 
                  startIcon={<CloudUpload />} 
                  onClick={handleUploadPhoto}
                >
                  Upload
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {isEditing ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Drawer Detalhes */}
      <Drawer 
        anchor="right" 
        open={Boolean(selectedProp)} 
        onClose={() => setSelectedProp(null)} 
        PaperProps={{ sx: { width: { xs: '100%', md: 400 } } }}
      >
        {selectedProp && (
          <Box p={3}>
            <Typography variant="h6" gutterBottom>Detalhes</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold">
              {selectedProp.proprietario}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, mt: 2 }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption">CAR</Typography>
                  <Typography variant="body2">{selectedProp.car}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption">Área</Typography>
                  <Typography variant="body2">{selectedProp.area} ha</Typography>
                </Grid>
              </Grid>
            </Paper>
            <MapEmbed lat={selectedProp.coords.lat} lng={selectedProp.coords.lng} />
          </Box>
        )}
      </Drawer>
    </Box>
  );
};
