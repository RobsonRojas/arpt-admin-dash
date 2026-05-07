import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, 
  Switch, FormControlLabel, Tabs, Tab, Divider,
  Card, CardContent, CardMedia, CardActions, Chip,
  CircularProgress
} from '@mui/material';
import { api } from '../../services/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Dropshipping() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  
  // Store form state
  const [storeForm, setStoreForm] = useState({
    name: '',
    slug: '',
    google_analytics_id: '',
    google_search_console_id: '',
    logoUrl: '',
    primaryColor: '#58820F',
    seoTitle: '',
    seoDescription: ''
  });

  const [catalog, setCatalog] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/manejos/dropshipping/stores');
      const stores = res.data;
      
      if (stores.length > 0) {
        const myStore = stores[0];
        setStore(myStore);
        
        let config = {};
        try { config = typeof myStore.config === 'string' ? JSON.parse(myStore.config) : myStore.config; } catch (e) {}

        setStoreForm({
          name: myStore.name || '',
          slug: myStore.slug || '',
          google_analytics_id: myStore.google_analytics_id || '',
          google_search_console_id: myStore.google_search_console_id || '',
          logoUrl: config?.logoUrl || '',
          primaryColor: config?.primaryColor || '#58820F',
          seoTitle: config?.seoTitle || '',
          seoDescription: config?.seoDescription || ''
        });

        // Fetch products and sales
        fetchCatalog(myStore.id);
        fetchSales(myStore.id);
      }
      
      // Fetch all available products to pick from
      const prodRes = await api.get('/produtos/all');
      if (prodRes.data && prodRes.data.success) {
         setAvailableProducts(prodRes.data.data.filter(p => p.is_ativo));
      }
    } catch (error) {
      console.error("Error fetching dropshipping data", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalog = async (storeId) => {
    try {
      const res = await api.get(`/manejos/dropshipping/stores/${storeId}/products`);
      setCatalog(res.data);
    } catch (err) {
      console.error("Error fetching catalog", err);
    }
  };

  const fetchSales = async (storeId) => {
    try {
      const res = await api.get(`/manejos/dropshipping/stores/${storeId}/sales`);
      setSales(res.data);
    } catch (err) {
      console.error("Error fetching sales", err);
    }
  };

  const handleSaveStore = async () => {
    try {
      const payload = {
        name: storeForm.name,
        slug: storeForm.slug,
        google_analytics_id: storeForm.google_analytics_id,
        google_search_console_id: storeForm.google_search_console_id,
        config: {
          logoUrl: storeForm.logoUrl,
          primaryColor: storeForm.primaryColor,
          seoTitle: storeForm.seoTitle,
          seoDescription: storeForm.seoDescription
        }
      };
      
      // For simplicity in this demo, just creating if not exists (POST)
      // Ideally we should have a PUT/PATCH if store exists
      if (!store) {
         const res = await api.post('/manejos/dropshipping/stores', payload);
         setStore(res.data);
      } else {
         alert("Atualização de loja existente precisa ser implementada no backend");
      }
    } catch (error) {
      console.error("Error saving store", error);
      alert("Erro ao salvar loja");
    }
  };

  const handleAddProduct = async (productId) => {
    if (!store) return alert("Crie a loja primeiro");
    try {
      await api.post(`/manejos/dropshipping/stores/${store.id}/products`, { productId });
      fetchCatalog(store.id);
    } catch (error) {
      alert("Erro ao adicionar produto: " + (error.response?.data?.error || ""));
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dropshipping Dashboard</Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Configuração da Loja" />
          <Tab label="Catálogo de Produtos" />
          <Tab label="Vendas e Comissões" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Branding e SEO</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nome da Loja" value={storeForm.name} onChange={e => setStoreForm({...storeForm, name: e.target.value})} margin="normal" />
              <TextField fullWidth label="URL Slug (ex: minha-loja)" value={storeForm.slug} onChange={e => setStoreForm({...storeForm, slug: e.target.value})} margin="normal" disabled={!!store} />
              <TextField fullWidth label="Logo URL" value={storeForm.logoUrl} onChange={e => setStoreForm({...storeForm, logoUrl: e.target.value})} margin="normal" />
              <TextField fullWidth label="Cor Primária (Hex)" value={storeForm.primaryColor} onChange={e => setStoreForm({...storeForm, primaryColor: e.target.value})} margin="normal" type="color" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="SEO Title" value={storeForm.seoTitle} onChange={e => setStoreForm({...storeForm, seoTitle: e.target.value})} margin="normal" />
              <TextField fullWidth label="SEO Description" value={storeForm.seoDescription} onChange={e => setStoreForm({...storeForm, seoDescription: e.target.value})} margin="normal" multiline rows={3} />
              <TextField fullWidth label="Google Analytics ID" value={storeForm.google_analytics_id} onChange={e => setStoreForm({...storeForm, google_analytics_id: e.target.value})} margin="normal" />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="primary" onClick={handleSaveStore}>
              Salvar Loja
            </Button>
          </Box>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Seu Catálogo Atual</Typography>
            {catalog.length === 0 ? <Typography color="textSecondary">Nenhum produto adicionado ainda.</Typography> : (
               <Grid container spacing={2}>
                 {catalog.map(prod => (
                   <Grid item xs={12} key={prod.id}>
                     <Card>
                       <CardContent>
                         <Typography variant="subtitle1">{prod.nome}</Typography>
                         <Typography variant="body2" color="textSecondary">R$ {prod.preco}</Typography>
                       </CardContent>
                     </Card>
                   </Grid>
                 ))}
               </Grid>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Produtos Disponíveis</Typography>
              <TextField 
                size="small" 
                placeholder="Filtrar por nome ou categoria..." 
                onChange={(e) => {
                  const val = e.target.value.toLowerCase();
                  // For now simple name filter, backend needs to return category/species
                  // Set filtering logic directly in render for simplicity
                  document.querySelectorAll('.available-prod-card').forEach(el => {
                    const text = el.textContent.toLowerCase();
                    el.style.display = text.includes(val) ? 'block' : 'none';
                  });
                }}
              />
            </Box>
            <Grid container spacing={2}>
                 {availableProducts.map(prod => {
                   const inCatalog = catalog.some(c => c.produto_id === prod.id || c.id === prod.id);
                   return (
                   <Grid item xs={12} sm={6} key={prod.id} className="available-prod-card">
                     <Card>
                       <CardContent>
                         <Typography variant="subtitle2" noWrap>{prod.nome}</Typography>
                         <Typography variant="body2" color="textSecondary">R$ {prod.preco}</Typography>
                         <Chip size="small" label={prod.is_physical_reward ? "Físico" : "Digital"} sx={{ mt: 1 }} />
                       </CardContent>
                       <CardActions>
                         <Button size="small" disabled={inCatalog} onClick={() => handleAddProduct(prod.id)}>
                           {inCatalog ? 'Já adicionado' : 'Adicionar ao Catálogo'}
                         </Button>
                       </CardActions>
                     </Card>
                   </Grid>
                 )})}
               </Grid>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
           <Typography variant="h6" gutterBottom>Vendas e Comissões</Typography>
           <Grid container spacing={3} sx={{ mb: 3 }}>
             <Grid item xs={12} sm={4}>
               <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                 <CardContent>
                   <Typography variant="subtitle2">Total de Vendas</Typography>
                   <Typography variant="h4">{sales.length}</Typography>
                 </CardContent>
               </Card>
             </Grid>
             <Grid item xs={12} sm={4}>
               <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                 <CardContent>
                   <Typography variant="subtitle2">Comissão Acumulada</Typography>
                   <Typography variant="h4">
                     R$ {sales.reduce((sum, s) => sum + (Number(s.split_dropshipper) || 0), 0).toFixed(2)}
                   </Typography>
                 </CardContent>
               </Card>
             </Grid>
           </Grid>
           
           <Typography variant="subtitle1" gutterBottom>Histórico Recente</Typography>
           {sales.length === 0 ? <Typography color="textSecondary">Nenhuma venda registrada ainda.</Typography> : (
             <Box>
               {sales.map(sale => (
                 <Box key={sale.id} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', py: 1 }}>
                   <Box>
                     <Typography variant="body2">{new Date(sale.created_at).toLocaleDateString()}</Typography>
                     <Typography variant="caption" color="textSecondary">Comprador: {sale.user_name || 'Anônimo'}</Typography>
                   </Box>
                   <Box textAlign="right">
                     <Typography variant="body2" fontWeight="bold">Comissão: R$ {Number(sale.split_dropshipper).toFixed(2)}</Typography>
                     <Typography variant="caption" color="textSecondary">Qtd: {sale.qtd}</Typography>
                   </Box>
                 </Box>
               ))}
             </Box>
           )}
        </Paper>
      </TabPanel>
    </Box>
  );
}
