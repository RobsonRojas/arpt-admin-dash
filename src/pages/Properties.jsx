import { useState, useRef } from 'react';
import {
  Box, Typography, Button, Table, TableContainer, TableHead,
  TableRow, TableCell, TableBody, Paper, IconButton, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  TextField, MenuItem, Drawer, Divider, CircularProgress,
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
    uploadPropertyPhoto,
    createPropertyPhoto,
    urlMidiasFiles
  } = useAdmin();

  const [openForm, setOpenForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProp, setSelectedProp] = useState(null);
  const [openInventory, setOpenInventory] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    address: '',
    car: '',
    id_municipality: '',
    area_he: '',
    info: '',
    status: 'Regular',
    foto: '',
    fotoFile: null,
    lat: '',
    lng: '',
    user_id: '',
  });

  const fileInputRef = useRef(null);
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
      name: '',
      address: '',
      car: '',
      id_municipality: '',
      area_he: '',
      info: '',
      status: 'Regular',
      foto: '',
      fotoFile: null,
      lat: '',
      lng: '',
      user_id: '',
    });
    setIsEditing(false);
    setOpenForm(true);
  };

  const handleOpenEdit = (prop) => {
    setFormData({
      id: prop.id,
      name: prop.name || '',
      address: prop.address || '',
      car: prop.car || '',
      id_municipality: prop.id_municipality || '',
      area_he: prop.area_he || '',
      info: prop.info || '',
      status: prop.status || 'Regular',
      foto: getPropertyImage(prop) || '',
      fotoFile: null,
      lat: prop.latitude || '',
      lng: prop.longitude || '',
      user_id: prop.user_id || '',
    });
    setIsEditing(true);
    setOpenForm(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        foto: previewUrl,
        fotoFile: file,
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert("Preencha o nome da propriedade");
      return;
    }

    let photoInternalPath = null;

    // If there's a new file to upload, upload it first
    if (formData.fotoFile && formData.id) {
      setUploading(true);
      try {
        const uploadResult = await uploadPropertyPhoto(formData.id, formData.fotoFile);
        if (uploadResult) {
          photoInternalPath = uploadResult.internalPath || uploadResult.filename;

          // Register the photo in the lugarfotos table
          await createPropertyPhoto({
            id_propriedade: Number(formData.id),
            url: `${urlMidiasFiles}${photoInternalPath}`,
            alt: `Foto da propriedade ${formData.name}`,
          });
        }
      } catch (error) {
        console.error("Erro ao fazer upload da foto:", error);
      } finally {
        setUploading(false);
      }
    }

    const dataToSave = {
      ...formData,
      ...(photoInternalPath && { image_internal_path: photoInternalPath }),
    };
    delete dataToSave.fotoFile;
    delete dataToSave.foto;

    if (isEditing) {
      handleUpdateProperty(dataToSave);
    } else {
      handleAddProperty(dataToSave);
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
                <TableCell>Proprietário</TableCell>
                <TableCell>Município</TableCell>
                <TableCell>Área (ha)</TableCell>
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
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {row.owner_name || row.user_id || '—'}
                      </Typography>
                      {row.user_id && row.owner_name && (
                        <Typography variant="caption" color="textSecondary">
                          ID: {row.user_id}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{row.id_municipality}</TableCell>
                  <TableCell>{row.area_he}</TableCell>
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
                  {row.owner_name && (
                    <Typography variant="caption" color="textSecondary">
                      Proprietário: {row.owner_name}
                    </Typography>
                  )}
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
                label="Nome da Propriedade"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption">CAR (Cadastro Ambiental Rural)</Typography>
                <AIAssistant
                  initialText={formData.car}
                  context={`Propriedade: ${formData.name}`}
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
                label="Município (ID)"
                value={formData.id_municipality}
                onChange={e => setFormData({ ...formData, id_municipality: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Área Total (ha)"
                value={formData.area_he}
                onChange={e => setFormData({ ...formData, area_he: e.target.value })}
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
              <TextField
                fullWidth
                label="Informações Adicionais"
                value={formData.info}
                onChange={e => setFormData({ ...formData, info: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
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
                  startIcon={uploading ? <CircularProgress size={18} /> : <CloudUpload />}
                  onClick={handleUploadClick}
                  disabled={uploading}
                >
                  {uploading ? 'Enviando...' : 'Upload'}
                </Button>
                {formData.fotoFile && (
                  <Typography variant="caption" color="success.main">
                    {formData.fotoFile.name}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={uploading}>
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
                alt={selectedProp.name}
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
              {selectedProp.name}
            </Typography>
            {selectedProp.owner_name && (
              <Typography variant="body2" color="textSecondary">
                Proprietário: {selectedProp.owner_name}
              </Typography>
            )}
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
