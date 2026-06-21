import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, CircularProgress,
  Divider, IconButton
} from '@mui/material';
import { ArrowBack, Store, Person, ContactMail, VpnKey, Public, Event, Edit } from '@mui/icons-material';
import { api } from '../services/api';
import { EditDropshipperModal } from './EditDropshipperModal';

export function DropshipperDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [error, setError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/admin/dropshipping/dropshippers/${id}`);
      setStore(response.data);
    } catch (err) {
      setError('Failed to load dropshipper details. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading && !store) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !store) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">{error || 'Store not found'}</Typography>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dropshipping-admin')} sx={{ mt: 2 }}>
          Back to list
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dropshipping-admin')} color="primary">
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">Detalhes do Dropshipper</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditModalOpen(true)}>
          Editar
        </Button>
      </Box>

      <EditDropshipperModal 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        store={store} 
        onUpdateSuccess={fetchDetails} 
      />

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person color="primary" /> Perfil do Usuário
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="body1">
                  <strong>Nome:</strong> {store.first_name} {store.last_name}
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ContactMail fontSize="small" color="action" />
                  <strong>Email:</strong> {store.email}
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VpnKey fontSize="small" color="action" />
                  <strong>User ID:</strong> <span style={{ fontFamily: 'monospace' }}>{store.user_id}</span>
                </Typography>
                <Typography variant="body1">
                  <strong>CPF:</strong> {store.cpf || 'Não informado'}
                </Typography>
                <Typography variant="body1">
                  <strong>Telefone:</strong> {store.phone || 'Não informado'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Store Info Card */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Store color="primary" /> Informações da Loja
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="body1">
                  <strong>Nome da Loja:</strong> {store.store_name}
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Public fontSize="small" color="action" />
                  <strong>Slug:</strong> <span style={{ fontFamily: 'monospace' }}>{store.slug}</span>
                </Typography>
                <Typography variant="body1">
                  <strong>Domínio Customizado:</strong> {store.custom_domain ? store.custom_domain : <em>Nenhum</em>} 
                  {store.domain_status && ` (${store.domain_status})`}
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Event fontSize="small" color="action" />
                  <strong>Criado em:</strong> {store.store_created_at ? new Date(store.store_created_at).toLocaleString('pt-BR') : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
