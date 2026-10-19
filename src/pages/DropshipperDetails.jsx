import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, CircularProgress,
  Divider, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction,
  FormControl, InputLabel, Select, MenuItem, Avatar, Switch, FormControlLabel, Chip, TextField
} from '@mui/material';
import { ArrowBack, Store, Person, ContactMail, VpnKey, Public, Event, Edit, LocationOn, Delete, AddBox, Inventory } from '@mui/icons-material';
import { api } from '../services/api';

export function DropshipperDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [userStores, setUserStores] = useState([]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/v1/admin/dropshipping/dropshippers/${id}`);
      const loja = data.lojas?.[0] ?? null;
      setStore({
        ...data.perfil,
        user_id: data.perfil.user_id,
        name: loja?.nome ?? data.perfil.nome_comercial,
        store_id: loja?.id ?? null,
        loja_status: loja?.status ?? null,
        slug: loja?.slug ?? null,
        commission_override: loja?.commission_override ?? null,
        limite_lojas: data.limite_lojas,
      });
      setUserStores(data.lojas.map((l) => ({ ...l, name: l.nome })));
      if (loja) fetchProducts(loja.id);
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
    const produto = availableProducts.find((p) => String(p.id) === String(selectedProductId));
    if (!produto || !store?.store_id) return;
    const entrada = window.prompt(`Preço de venda para "${produto.nome}" (R$):`, (Number(produto.preco) * 1.3).toFixed(2));
    if (entrada === null) return;
    const precoVenda = Number(entrada.replace(',', '.'));
    if (!(precoVenda > 0)) return alert('Informe um preço de venda válido.');
    try {
      setLoadingProducts(true);
      await api.post(`/api/v1/admin/dropshipping/stores/${store.store_id}/products`, {
        produto_id: produto.id,
        preco_venda: precoVenda,
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

  const [overrideInput, setOverrideInput] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  const handleSaveOverride = async () => {
    if (!store?.store_id) return;
    const valor = overrideInput.trim() === '' ? null : Number(overrideInput.replace(',', '.'));
    if (valor !== null && !(valor >= 0 && valor <= 100)) return alert('A comissão deve estar entre 0 e 100.');
    setSavingOverride(true);
    try {
      await api.put(`/api/v1/admin/dropshipping/stores/${store.store_id}`, { commission_override: valor });
      setOverrideInput('');
      await fetchDetails();
      alert(valor === null ? 'Comissão da loja voltou ao padrão do dropshipping.' : 'Comissão da loja atualizada.');
    } catch (err) {
      alert('Erro ao salvar comissão: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingOverride(false);
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
      </Box>

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
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip size="small" label={`Loja: ${store.loja_status ?? 'sem loja'}`} />
                  <TextField
                    size="small"
                    label="Comissão desta loja (%)"
                    placeholder={store.commission_override != null ? String(store.commission_override) : 'padrão do dropshipping'}
                    value={overrideInput}
                    onChange={(e) => setOverrideInput(e.target.value)}
                    helperText="Vazio usa a comissão padrão. Taxa por manejo não se aplica."
                  />
                  <Button variant="outlined" size="small" onClick={handleSaveOverride} disabled={savingOverride || !store.store_id}>
                    Salvar comissão
                  </Button>
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
                    <React.Fragment key={product.produto_id}>
                      <ListItem>
                        <ListItemText 
                          primary={product.nome} 
                          secondary={`Preço de venda: R$ ${Number(product.preco_venda).toFixed(2).replace('.', ',')} | ${product.ativo ? 'Ativo' : `Pausado (${product.pausado_motivo ?? 'motivo não informado'})`}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" color="error" onClick={() => handleRemoveProduct(product.produto_id)}>
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
