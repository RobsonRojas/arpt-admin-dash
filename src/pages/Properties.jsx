import React, { useState } from 'react';
import {
  Box, Typography, Button, Table, TableContainer, TableHead, 
  TableRow, TableCell, TableBody, Paper, IconButton, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, 
  TextField, MenuItem, Drawer, Divider, List, ListItem, ListItemText
} from '@mui/material';
import { Add, Visibility, Edit, CloudUpload, HomeWork, Park } from '@mui/icons-material';
import { StatusChip, MapEmbed, InventoryManager } from '../components';
import { STATUS_PROPRIEDADE } from '../constants';
import { useAdmin } from '../contexts/AdminContext';

export const Properties = () => {
  const {
    properties,
    handleAddProperty,
    handleUpdateProperty,
    urlMidiasFiles
  } = useAdmin();
  
  const [openForm, setOpenForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProp, setSelectedProp] = useState(null);
  const [openInventory, setOpenInventory] = useState(false);
  
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
      lat: prop.latitude, 
      lng: prop.longitude
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
              {/* <TableCell>Status</TableCell> */}
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {properties.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar src={`${urlMidiasFiles}${row.image_internal_path}`} variant="rounded">
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {row.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {row.car}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{row.id_municipality}</TableCell>
                <TableCell>{row.area_he}</TableCell>
                {/* <TableCell>
                  <StatusChip status={row.status} />
                </TableCell> */}
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
                  <Typography variant="body2">{selectedProp.area_he} ha</Typography>
                </Grid>
              </Grid>
            </Paper>
            {selectedProp.latitude != null && selectedProp.longitude != null && (
              <MapEmbed lat={selectedProp.latitude} lng={selectedProp.longitude} />
            )}
            <Button 
              fullWidth 
              variant="contained" 
              color="success" 
              startIcon={<Park />} 
              onClick={() => setOpenInventory(true)}
              sx={{ mt: 2 }}
            >
              Gerir Inventário de Árvores
            </Button>
          </Box>
        )}
      </Drawer>

      {/* Modal Fullscreen de Inventário */}
      <Dialog 
        open={openInventory} 
        onClose={() => setOpenInventory(false)} 
        fullScreen
      >
        {selectedProp && (
          <InventoryManager 
            property={selectedProp} 
            onClose={() => setOpenInventory(false)} 
          />
        )}
      </Dialog>
    </Box>
  );
};
