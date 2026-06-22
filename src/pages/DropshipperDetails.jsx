import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, CircularProgress,
  Divider, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { ArrowBack, Store, Person, ContactMail, VpnKey, Public, Event, Edit, LocationOn, Delete, AddBox, Inventory } from '@mui/icons-material';
import { api } from '../services/api';
import { EditDropshipperModal } from './EditDropshipperModal';

export function DropshipperDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [error, setError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/admin/dropshipping/dropshippers/${id}`);
      setStore(response.data);
      if (response.data?.store_id) {
        fetchProducts(response.data.store_id);
      }
    } catch (err) {
      setError('Failed to load dropshipper details. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (storeId) => {
    try {
      setLoadingProducts(true);
      const [prodRes, availRes] = await Promise.all([
        api.get(`/api/v1/admin/dropshipping/stores/${storeId}/products`),
        api.get(`/api/v1/admin/dropshipping/products/available`)
      ]);
      setProducts(prodRes.data);
      setAvailableProducts(availRes.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProductId || !store?.store_id) return;
    try {
      setLoadingProducts(true);
      await api.post(`/api/v1/admin/dropshipping/stores/${store.store_id}/products`, {
        product_ids: [selectedProductId]
      });
      setSelectedProductId('');
      await fetchProducts(store.store_id);
    } catch (err) {
      alert('Erro ao alocar produto: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!store?.store_id) return;
    try {
      setLoadingProducts(true);
      await api.delete(`/api/v1/admin/dropshipping/stores/${store.store_id}/products/${productId}`);
      await fetchProducts(store.store_id);
    } catch (err) {
      alert('Erro ao remover produto: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingProducts(false);
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
                
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" /> Endereço Sede
                </Typography>
                <Typography variant="body2">
                  {store.address_street || store.address_city 
                    ? `${store.address_street || ''}${store.address_number ? `, ${store.address_number}` : ''}${store.address_complement ? ` - ${store.address_complement}` : ''}${store.address_neighborhood ? ` - ${store.address_neighborhood}` : ''}${store.address_city ? ` - ${store.address_city}` : ''}${store.address_state ? `/${store.address_state}` : ''}${store.cep ? ` - CEP: ${store.cep}` : ''}`.replace(/^[\s,-]+/, '') 
                    : 'Endereço não informado'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Store Products Card */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Inventory color="primary" /> Produtos Alocados
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
                <FormControl size="small" sx={{ minWidth: 300 }}>
                  <InputLabel>Adicionar Produto</InputLabel>
                  <Select
                    value={selectedProductId}
                    label="Adicionar Produto"
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    {availableProducts.map((p) => (
                      <MenuItem key={p.id} value={p.id} disabled={products.some(alloc => alloc.id === p.id)}>
                        {p.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  startIcon={<AddBox />} 
                  onClick={handleAddProduct}
                  disabled={!selectedProductId || loadingProducts}
                >
                  Adicionar
                </Button>
              </Box>

              {loadingProducts ? (
                <Box display="flex" justifyContent="center" p={2}><CircularProgress size={30} /></Box>
              ) : products.length === 0 ? (
                <Typography color="text.secondary">Nenhum produto alocado para esta loja ainda.</Typography>
              ) : (
                <List sx={{ width: '100%', bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  {products.map((product, index) => (
                    <React.Fragment key={product.id}>
                      <ListItem>
                        <ListItemText 
                          primary={product.nome} 
                          secondary={`Preço: R$ ${Number(product.preco).toFixed(2).replace('.', ',')} | Status: ${product.is_public ? 'Público' : 'Oculto'}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" color="error" onClick={() => handleRemoveProduct(product.id)}>
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < products.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
