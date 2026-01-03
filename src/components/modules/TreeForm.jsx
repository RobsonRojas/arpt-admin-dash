import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, TextField, Button, MenuItem, Paper, 
  Avatar, IconButton
} from '@mui/material';
import { PhotoCamera, Close } from '@mui/icons-material';

export const TreeForm = ({ initialData, onSave, onCancel, propertyId, inventoryId }) => {
  const [form, setForm] = useState(initialData || {
    propertyId: propertyId,
    inventoryId: inventoryId,
    popularName: "",
    specieName: "",
    number: "",
    pique: "",
    cap: "",
    dap: "",
    height: "",
    comercialHeight: "",
    fuste: "reto",
    latitude: "",
    longitude: "",
    volume: "",
    cuttingVolume: "",
    classification: "Corte Futuro",
    coordPrecistion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    photos: []
  });

  // Calcula DAP automaticamente quando CAP muda
  useEffect(() => {
    if (form.cap) {
      const dapCalc = (parseFloat(form.cap) / Math.PI).toFixed(2);
      if (dapCalc !== form.dap) {
        setForm(f => ({ ...f, dap: dapCalc }));
      }
    }
  }, [form.cap]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddPhoto = () => {
    const newPhoto = {
      id: Date.now(),
      url: `https://picsum.photos/200?random=${Math.floor(Math.random() * 1000)}`,
      name: `Foto ${form.photos.length + 1}`
    };
    setForm({ ...form, photos: [...form.photos, newPhoto] });
  };

  const handleRemovePhoto = (id) => {
    setForm({ ...form, photos: form.photos.filter(p => p.id !== id) });
  };

  const handleSave = () => {
    const hasPopular = (form.popularName || '').trim() !== '';
    const hasSpecie = (form.specieName || '').trim() !== '';
    const hasNumber = (form.number || '').toString().trim() !== '';
    
    if (!hasPopular || !hasSpecie || !hasNumber) {
      alert("Preencha os campos obrigatórios (Nome Popular, Espécie e Nº Placa)");
      return;
    }
    onSave({ ...form, inventoryId });
  };

  return (
    <Box p={2}>
      <Grid container spacing={2}>
        {/* IDENTIFICAÇÃO */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            Identificação
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Nº Placa"
            name="number"
            type="number"
            value={form.number}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Pique"
            name="pique"
            value={form.pique}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Nome Popular"
            name="popularName"
            value={form.popularName}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Nome Científico"
            name="specieName"
            value={form.specieName}
            onChange={handleChange}
            required
          />
        </Grid>

        {/* BIOMETRIA */}
        <Grid item xs={12} mt={1}>
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            Biometria
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="CAP (cm)"
            name="cap"
            type="number"
            value={form.cap}
            onChange={handleChange}
            inputProps={{ step: "0.01" }}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="DAP (cm)"
            name="dap"
            value={form.dap}
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Fuste"
            name="fuste"
            select
            value={form.fuste}
            onChange={handleChange}
          >
            <MenuItem value="reto">Reto</MenuItem>
            <MenuItem value="tortuoso">Tortuoso</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Altura Total (m)"
            name="height"
            type="number"
            value={form.height}
            onChange={handleChange}
            inputProps={{ step: "0.1" }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Altura Comercial (m)"
            name="comercialHeight"
            type="number"
            value={form.comercialHeight}
            onChange={handleChange}
            inputProps={{ step: "0.1" }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Volume (m³)"
            name="volume"
            type="number"
            value={form.volume}
            onChange={handleChange}
            inputProps={{ step: "0.01" }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Volume de Corte (m³)"
            name="cuttingVolume"
            type="number"
            value={form.cuttingVolume}
            onChange={handleChange}
            inputProps={{ step: "0.01" }}
          />
        </Grid>

        {/* LOCALIZAÇÃO & STATUS */}
        <Grid item xs={12} mt={1}>
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            Localização & Status
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Latitude"
            name="latitude"
            type="number"
            value={form.latitude}
            onChange={handleChange}
            inputProps={{ step: "0.0001" }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Longitude"
            name="longitude"
            type="number"
            value={form.longitude}
            onChange={handleChange}
            inputProps={{ step: "0.0001" }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Classificação (1-3)"
            name="classification"
            value={form.classification}
            onChange={handleChange}
          />
        </Grid>

        {/* FOTOS */}
        <Grid item xs={12} mt={1}>
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            Fotos ({form.photos.length})
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {form.photos.map(p => (
              <Box key={p.id} position="relative">
                <Avatar src={p.url} variant="rounded" sx={{ width: 60, height: 60 }} />
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'white' }}
                  onClick={() => handleRemovePhoto(p.id)}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              sx={{ height: 60, width: 60, minWidth: 60 }}
              onClick={handleAddPhoto}
            >
              <PhotoCamera />
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* BOTÕES AÇÃO */}
      <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>
          Salvar Árvore
        </Button>
      </Box>
    </Box>
  );
};
