import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, CircularProgress
} from '@mui/material';
import { api } from '../services/api';

export function EditDropshipperModal({ open, onClose, store, onUpdateSuccess }) {
  const [loading, setLoading] = useState(false);
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
    address_state: ''
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
        address_state: store.address_state || ''
      });
    }
  }, [store, open]);

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
