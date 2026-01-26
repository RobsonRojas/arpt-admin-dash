import { useState, useRef } from 'react';
import {
  Box, Typography, Button, Table, TableContainer, TableHead,
  TableRow, TableCell, TableBody, Paper, IconButton, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  TextField, MenuItem, Drawer, Divider,
} from '@mui/material';
import { Add, Visibility, Edit, CloudUpload, HomeWork, Park, Image as ImageIcon } from '@mui/icons-material';
import { AIAssistant } from '../components/AIAssistant';
import { MapEmbed, InventoryManager } from '../components';
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

  const skipRef = useRef(null);

  const handleSkip = (e) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.tabIndex = -1;
      mainContent.focus();
      setTimeout(() => {
        mainContent.removeAttribute('tabindex');
      }, 100);
    }
  };

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

  const getPropertyImage = (prop) => {
    if (prop.foto) return prop.foto;
    if (prop.image_internal_path) return `${urlMidiasFiles}${prop.image_internal_path}`;
    return null;
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <a href="#main-content" onClick={handleSkip} ref={skipRef} style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>Skip to main content</a>
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

      <Box>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', display: { xs: 'none', md: 'block' } }} id="main-content">
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell>ID</TableCell>
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
                    <Typography variant="body2" fontWeight="medium">
                      {row.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={getPropertyImage(row)}
                        variant="rounded"
                      >
                        <ImageIcon />
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
                      aria-label="Visualizar propriedade"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => handleOpenEdit(row)}
                      title="Editar"
                      aria-label="Editar propriedade"
                    >
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
          {properties.map((row) => (
            <Paper key={row.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box display="flex" gap={2} alignItems="center">
                <Avatar
                  src={getPropertyImage(row)}
                  variant="rounded"
                  sx={{ width: 60, height: 60 }}
                >
                  <ImageIcon />
                </Avatar>
                <Box flex={1}>
                  <Typography fontWeight="bold" variant="subtitle1">{row.name}</Typography>
                  <Typography variant="body2" color="textSecondary">{row.car}</Typography>
                </Box>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                <Typography variant="body2">{row.id_municipality}</Typography>
                <Typography variant="body2" fontWeight="bold">{row.area_he} ha</Typography>
              </Box>

              <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                <Button size="small" startIcon={<Visibility />} onClick={() => setSelectedProp(row)}>
                  Ver Detalhes
                </Button>
                <Button size="small" startIcon={<Edit />} onClick={() => handleOpenEdit(row)}>
                  Editar
                </Button>
              </Box>
            </Paper>
          ))}
          {properties.length === 0 && (
            <Typography align="center" color="textSecondary">Nenhuma propriedade encontrada</Typography>
          )}
        </Box>
      </Box>

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
                onChange={e => setFormData({ ...formData, proprietario: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption">CAR (Cadastro Ambiental Rural)</Typography>
                <AIAssistant
                  initialText={formData.car}
                  context={`Propriedade: ${formData.proprietario}`}
                  onApply={(text) => setFormData({ ...formData, car: text })}
                  label="Corrigir"
                />
              </Box>
              <TextField
                fullWidth
                label="Número CAR"
                value={formData.car}
                onChange={e => setFormData({ ...formData, car: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Município"
                value={formData.municipio}
                onChange={e => setFormData({ ...formData, municipio: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Área Total (ha)"
                value={formData.area}
                onChange={e => setFormData({ ...formData, area: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
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
          <Box p={3} display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography variant="h6" gutterBottom>Detalhes</Typography>
              <Divider sx={{ mb: 2 }} />
            </Box>

            {getPropertyImage(selectedProp) && (
              <Box
                component="img"
                src={getPropertyImage(selectedProp)}
                alt={selectedProp.proprietario}
                onError={(e) => { e.target.style.display = 'none'; }}
                sx={{
                  width: '100%',
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: 1
                }}
              />
            )}

            <Typography variant="subtitle1" fontWeight="bold">
              {selectedProp.proprietario}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
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
              sx={{ mt: 'auto' }}
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
