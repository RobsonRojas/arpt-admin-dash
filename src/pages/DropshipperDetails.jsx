import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, CircularProgress,
  Divider, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction,
  FormControl, InputLabel, Select, MenuItem, Avatar, Switch, FormControlLabel
} from '@mui/material';
import { ArrowBack, Store, Person, ContactMail, VpnKey, Public, Event, Edit, LocationOn, Delete, AddBox, Inventory } from '@mui/icons-material';
import { api } from '../services/api';
import { EditDropshipperModal } from './EditDropshipperModal';
import { EditAllocatedProductModal } from './EditAllocatedProductModal';

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
  const [editingProduct, setEditingProduct] = useState(null);
  const [userStores, setUserStores] = useState([]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/admin/dropshipping/dropshippers/${id}`);
      setStore(response.data);
      if (response.data?.store_id) {
        fetchProducts(response.data.store_id);
      }
      if (response.data?.user_id) {
        const storesRes = await api.get(`/api/v1/admin/dropshipping/stores?user_id=${response.data.user_id}`);
        setUserStores(storesRes.data.stores || []);
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

  const handleTogglePublic = async (event) => {
    const newValue = event.target.checked;
    try {
      await api.put(`/api/v1/admin/dropshipping/dropshippers/${id}`, {
        is_public: newValue
      });
      fetchDetails();
    } catch (err) {
      alert('Erro ao atualizar visibilidade da loja: ' + (err.response?.data?.error || err.message));
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

  let logoFilename = '';
  let seoKeywords = '';
  let headScripts = '';
  if (store.config) {
    try {
      const parsed = typeof store.config === 'string' ? JSON.parse(store.config) : store.config;
      logoFilename = parsed.logoFilename || '';
      seoKeywords = parsed.seoKeywords || '';
      headScripts = parsed.headScripts || '';
    } catch(e) {}
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

      <EditAllocatedProductModal
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        storeId={store?.store_id}
        product={editingProduct}
        onUpdateSuccess={() => fetchProducts(store.store_id)}
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  {logoFilename ? (
                    <Avatar
                      src={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/midias/files/${logoFilename}` : `https://arpt.site/midias/files/${logoFilename}`}
                      variant="rounded"
                      sx={{ width: 64, height: 64, border: '1px solid #e0e0e0' }}
                    />
                  ) : (
                    <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: 'grey.200', color: 'grey.500' }}>
                      {store.store_name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  )}
                  <Box>
                    <Typography variant="body1">
                      <strong>Nome da Loja:</strong> {store.store_name}
                    </Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Public fontSize="small" color="action" />
                      <strong>Slug:</strong> <span style={{ fontFamily: 'monospace' }}>{store.slug}</span>
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1">
                  <strong>Domínio Customizado:</strong> {store.custom_domain ? store.custom_domain : <em>Nenhum</em>} 
                  {store.domain_status && ` (${store.domain_status})`}
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Event fontSize="small" color="action" />
                  <strong>Criado em:</strong> {store.store_created_at ? new Date(store.store_created_at).toLocaleString('pt-BR') : 'N/A'}
                </Typography>

                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!store.is_public}
                        onChange={handleTogglePublic}
                        color="primary"
                      />
                    }
                    label={store.is_public ? 'Loja Pública (Ativa)' : 'Loja Privada (Oculta)'}
                  />
                </Box>
                
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

        {/* User's Stores List Card */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Store color="primary" /> Todas Lojas do Dropshipper
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {userStores.length === 0 ? (
                <Typography color="text.secondary">Nenhuma loja encontrada.</Typography>
              ) : (
                <List sx={{ width: '100%', bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  {userStores.map((s, index) => (
                    <React.Fragment key={s.id}>
                      <ListItem button onClick={() => navigate(`/dropshipping-admin/${s.id}`)}>
                        <ListItemText 
                          primary={s.name} 
                          secondary={`Slug: ${s.slug} | Domínio: ${s.custom_domain || 'Nenhum'} | Produtos: ${s.product_count}`}
                        />
                      </ListItem>
                      {index < userStores.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Marketing & SEO Card */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Public color="primary" /> Marketing & SEO
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Palavras-Chave (SEO)</Typography>
                  <Typography variant="body2" sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1, border: '1px solid #eee' }}>
                    {seoKeywords || <em>Nenhuma configurada</em>}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Scripts do Cabeçalho (&lt;head&gt;)</Typography>
                  <Box sx={{ bgcolor: 'grey.900', color: '#4caf50', p: 1.5, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                    {headScripts || <em>Nenhum script configurado</em>}
                  </Box>
                </Box>
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
                          <IconButton edge="end" color="primary" onClick={() => setEditingProduct(product)} sx={{ mr: 1 }}>
                            <Edit />
                          </IconButton>
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
