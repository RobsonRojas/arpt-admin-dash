import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, CircularProgress, Box, Typography,
  FormControl, InputLabel, Select, MenuItem, Avatar, IconButton
} from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';
import { api } from '../services/api';

export function EditDropshipperModal({ open, onClose, store, onUpdateSuccess }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [formData, setFormData] = useState({
    store_name: '',
    slug: '',
    custom_domain: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    cpf: '',
    cep: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    logoFilename: '',
    seoKeywords: '',
    headScripts: ''
  });

  useEffect(() => {
    if (store && open) {
      setFormData({
        store_name: store.store_name || '',
        slug: store.slug || '',
        custom_domain: store.custom_domain || '',
        first_name: store.first_name || '',
        last_name: store.last_name || '',
        email: store.email || '',
        phone: store.phone || '',
        cpf: store.cpf || '',
        cep: store.cep || '',
        address_street: store.address_street || '',
        address_number: store.address_number || '',
        address_complement: store.address_complement || '',
        address_neighborhood: store.address_neighborhood || '',
        address_city: store.address_city || '',
        address_state: store.address_state || '',
        logoFilename: '',
        seoKeywords: '',
        headScripts: ''
      });
      
      if (store.config) {
        try {
           const parsed = typeof store.config === 'string' ? JSON.parse(store.config) : store.config;
           setFormData(prev => ({ 
             ...prev, 
             logoFilename: parsed.logoFilename || '',
             seoKeywords: parsed.seoKeywords || '',
             headScripts: parsed.headScripts || ''
           }));
        } catch(e) {}
      }
    }
  }, [store, open]);

  useEffect(() => {
    if (open) {
      api.get('/midias/list')
         .then(res => {
            const images = res.data.filter(f => f.type === 'image');
            setMediaList(images);
         })
         .catch(err => console.error('Error fetching media:', err));
    }
  }, [open]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formPayload = new FormData();
    formPayload.append('file', file);
    setUploading(true);
    try {
      const res = await api.post('/medias/upload', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.filename) {
         setFormData(prev => ({ ...prev, logoFilename: res.data.filename }));
         // Refresh list
         const filesRes = await api.get('/midias/list');
         setMediaList(filesRes.data.filter(f => f.type === 'image'));
      }
    } catch (err) {
      alert('Erro ao fazer upload da imagem: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/api/v1/admin/dropshipping/dropshippers/${store.store_id}`, formData);
      onUpdateSuccess();
      onClose();
    } catch (err) {
      alert('Error updating details: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Editar Informações do Dropshipper</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nome da Loja" name="store_name" value={formData.store_name} onChange={handleChange} required margin="dense" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Slug" name="slug" value={formData.slug} onChange={handleChange} required margin="dense" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Domínio Customizado" name="custom_domain" value={formData.custom_domain} onChange={handleChange} margin="dense" helperText="Ex: loja.com.br" />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                {formData.logoFilename ? (
                  <Avatar 
                    src={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/midias/files/${formData.logoFilename}` : `https://arpt.site/midias/files/${formData.logoFilename}`} 
                    variant="rounded" 
                    sx={{ width: 80, height: 80 }} 
                  />
                ) : (
                  <Avatar variant="rounded" sx={{ width: 80, height: 80, bgcolor: 'grey.200' }} />
                )}
                <Box sx={{ flexGrow: 1 }}>
                  <FormControl fullWidth size="small" margin="dense">
                    <InputLabel>Logo da Loja</InputLabel>
                    <Select
                      name="logoFilename"
                      value={formData.logoFilename}
                      onChange={handleChange}
                      label="Logo da Loja"
                    >
                      <MenuItem value=""><em>Nenhuma</em></MenuItem>
                      {mediaList.map(media => (
                        <MenuItem key={media.filename} value={media.filename}>
                          {media.filename}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="logo-upload-file"
                    type="file"
                    onChange={handleUpload}
                  />
                  <label htmlFor="logo-upload-file">
                    <Button variant="outlined" component="span" startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />} disabled={uploading}>
                      Upload
                    </Button>
                  </label>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nome (Usuário)" name="first_name" value={formData.first_name} onChange={handleChange} required margin="dense" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Sobrenome (Usuário)" name="last_name" value={formData.last_name} onChange={handleChange} required margin="dense" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required margin="dense" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Telefone" name="phone" value={formData.phone} onChange={handleChange} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="CPF" name="cpf" value={formData.cpf} onChange={handleChange} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="CEP" name="cep" value={formData.cep} onChange={handleChange} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Logradouro (Rua)" name="address_street" value={formData.address_street} onChange={handleChange} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth label="Número" name="address_number" value={formData.address_number} onChange={handleChange} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Complemento" name="address_complement" value={formData.address_complement} onChange={handleChange} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Bairro" name="address_neighborhood" value={formData.address_neighborhood} onChange={handleChange} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Cidade" name="address_city" value={formData.address_city} onChange={handleChange} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Estado" name="address_state" value={formData.address_state} onChange={handleChange} margin="dense" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Palavras-Chave (SEO)" name="seoKeywords" value={formData.seoKeywords} onChange={handleChange} margin="dense" helperText="Ex: móveis rústicos, madeira de lei, decoração" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={4} label="Scripts do Cabeçalho (<head>)" name="headScripts" value={formData.headScripts} onChange={handleChange} margin="dense" helperText="Ex: Scripts de rastreamento do Facebook Pixel, GTM, etc. Inclua as tags <script> completas." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
