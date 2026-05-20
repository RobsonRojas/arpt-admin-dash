import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, 
  Switch, FormControlLabel, Tabs, Tab, Divider,
  Card, CardContent, CardMedia, CardActions, Chip,
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, CardHeader, Alert
} from '@mui/material';
import { api } from '../../services/api';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PreviewIcon from '@mui/icons-material/Preview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

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
  
  // AI Wizard states
  const [promptInput, setPromptInput] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Store form state
  const [storeForm, setStoreForm] = useState({
    name: '',
    slug: '',
    google_analytics_id: '',
    google_search_console_id: '',
    logoUrl: '',
    primaryColor: '#58820F',
    seoTitle: '',
    seoDescription: '',
    splitPlatform: 0.10,
    splitDropshipper: 0.20,
    splitProducer: 0.70,
    visualPreset: 'classic_wood',
    globalMarkupPercentage: 15,
    aiSlogan: ''
  });

  const [catalog, setCatalog] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Marketing Hub states
  const [selectedMarketingProduct, setSelectedMarketingProduct] = useState(null);
  const [marketingAssets, setMarketingAssets] = useState(null);

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
          seoDescription: config?.seoDescription || '',
          splitPlatform: config?.splitPlatform ?? 0.10,
          splitDropshipper: config?.splitDropshipper ?? 0.20,
          splitProducer: config?.splitProducer ?? 0.70,
          visualPreset: myStore.visual_preset || 'classic_wood',
          globalMarkupPercentage: myStore.global_markup_percentage ?? 15,
          aiSlogan: myStore.ai_slogan || ''
        });

        // Fetch products, sales and analytics
        fetchCatalog(myStore.id);
        fetchSales(myStore.id);
        fetchAnalytics(myStore.id);
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
      if (res.data.length > 0 && !selectedMarketingProduct) {
        setSelectedMarketingProduct(res.data[0]);
      }
    } catch (err) {
      console.error("Error fetching catalog", err);
    }
  };

  useEffect(() => {
    if (selectedMarketingProduct) {
      fetchMarketingAssets(selectedMarketingProduct.produto_id || selectedMarketingProduct.id);
    }
  }, [selectedMarketingProduct]);

  const fetchMarketingAssets = async (productId) => {
    try {
      const res = await api.get(`/produtos/${productId}/assets`);
      setMarketingAssets(res.data);
    } catch (err) {
      console.error("Error fetching marketing assets", err);
      setMarketingAssets(null);
    }
  };

  const fetchAnalytics = async (storeId) => {
    try {
      const res = await api.get(`/manejos/dropshipping/stores/${storeId}/analytics`);
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error fetching analytics", err);
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
        visual_preset: storeForm.visualPreset,
        global_markup_percentage: Number(storeForm.globalMarkupPercentage),
        ai_slogan: storeForm.aiSlogan,
        config: {
          logoUrl: storeForm.logoUrl,
          primaryColor: storeForm.primaryColor,
          seoTitle: storeForm.seoTitle,
          seoDescription: storeForm.seoDescription,
          splitPlatform: Number(storeForm.splitPlatform),
          splitDropshipper: Number(storeForm.splitDropshipper),
          splitProducer: Number(storeForm.splitProducer)
        }
      };
      
      if (!store) {
         const res = await api.post('/manejos/dropshipping/stores', payload);
         setStore(res.data);
         alert("Loja criada com sucesso!");
      } else {
         const res = await api.put(`/manejos/dropshipping/stores/${store.id}`, payload);
         setStore(res.data);
         alert("Loja atualizada com sucesso!");
      }
    } catch (error) {
      console.error("Error saving store", error);
      alert("Erro ao salvar loja: " + (error.response?.data?.error || ""));
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

  const handleGenerateAI = async () => {
    if (!promptInput.trim()) return alert("Por favor, digite um prompt para a IA!");
    setAiGenerating(true);
    try {
      const res = await api.post('/api/v1/dropshipping/ai-generator', { prompt: promptInput });
      setAiResult(res.data);
      setAiDialogOpen(true);
    } catch (err) {
      console.error("Error invoking AI generator", err);
      alert("Erro ao gerar com IA: " + (err.response?.data?.error || err.message));
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplyAISuggestion = async () => {
    if (!aiResult) return;
    
    const slugified = aiResult.storeName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Update store configurations
    setStoreForm(prev => ({
      ...prev,
      name: aiResult.storeName,
      slug: slugified,
      visualPreset: aiResult.visualPreset || 'classic_wood',
      aiSlogan: aiResult.slogan || '',
      seoTitle: `${aiResult.storeName} | Marketplace Ecológico`,
      seoDescription: aiResult.slogan || `Móveis e produtos sustentáveis de manejo florestal na Amazônia.`
    }));

    setAiDialogOpen(false);
    alert("Sugestões aplicadas no formulário! Clique em 'Salvar Loja' para persistir e criar a sua vitrine.");
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    alert("Texto copiado para a área de transferência!");
  };

  const handleDownloadAsset = (url) => {
    window.open(url, '_blank');
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Dashboard Dropshipping</Typography>
          <Typography variant="caption" color="textSecondary">
            Gerencie sua marca, cure catálogos de origem Amazônica e impulsione suas vendas verdes.
          </Typography>
        </Box>
        <Chip icon={<StorefrontIcon />} label={store ? `Loja Ativa: ${store.name}` : "Nenhuma loja cadastrada"} color={store ? "success" : "warning"} />
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Configuração da Loja" />
          <Tab label="Catálogo de Curação" />
          <Tab label="Vendas & Comissões" />
          <Tab label="Marketing Hub & Assets" />
        </Tabs>
      </Box>

      {/* TAB 0: CONFIGURATION & LIVE VISUAL PREVIEWER */}
      <TabPanel value={tabValue} index={0}>
        {/* AI Co-Pilot prompt wizard panel */}
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, mb: 4, bgcolor: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <AutoAwesomeIcon sx={{ color: '#16a34a' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#16a34a' }}>
              Assistente de Criação AI (Co-Pilot Wizard)
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Descreva que tipo de loja você deseja criar (público-alvo, nicho, estilo) e nossa IA criará uma marca personalizada, escolherá um slogan memorável, configurará o visual ideal e pré-selecionará os melhores produtos ecológicos.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField 
              fullWidth 
              variant="outlined" 
              placeholder="Ex: Crie uma loja sofisticada de utensílios artesanais de sementes e marcenaria fina para um público engajado com design e natureza..."
              value={promptInput}
              onChange={e => setPromptInput(e.target.value)}
              disabled={aiGenerating}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            />
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleGenerateAI}
              disabled={aiGenerating}
              startIcon={aiGenerating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
              sx={{ px: 4, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
            >
              {aiGenerating ? 'Gerando...' : 'Gerar com IA'}
            </Button>
          </Box>
        </Paper>

        <Grid container spacing={4}>
          {/* Form Configuration Inputs */}
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Identidade, Branding & SEO</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Nome da Loja" value={storeForm.name} onChange={e => setStoreForm({...storeForm, name: e.target.value})} margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="URL Slug (ex: minha-loja)" value={storeForm.slug} onChange={e => setStoreForm({...storeForm, slug: e.target.value})} margin="normal" disabled={!!store} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Slogan da Loja (AI Slogan)" value={storeForm.aiSlogan} onChange={e => setStoreForm({...storeForm, aiSlogan: e.target.value})} margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Visual Preset Layout" value={storeForm.visualPreset} onChange={e => setStoreForm({...storeForm, visualPreset: e.target.value})} select margin="normal">
                    <MenuItem value="classic_wood">Classic Wood (Tons Quentes)</MenuItem>
                    <MenuItem value="forest_light">Forest Light (Eco Clássico)</MenuItem>
                    <MenuItem value="modern_dark">Modern Dark (Luxo Noite)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Margem de Lucro Adicional (%)" value={storeForm.globalMarkupPercentage} onChange={e => setStoreForm({...storeForm, globalMarkupPercentage: e.target.value})} margin="normal" type="number" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Logo URL" value={storeForm.logoUrl} onChange={e => setStoreForm({...storeForm, logoUrl: e.target.value})} margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Cor de Destaque (Hex)" value={storeForm.primaryColor} onChange={e => setStoreForm({...storeForm, primaryColor: e.target.value})} margin="normal" type="color" />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Configurações de SEO</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Meta SEO Title" value={storeForm.seoTitle} onChange={e => setStoreForm({...storeForm, seoTitle: e.target.value})} margin="normal" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Meta SEO Description" value={storeForm.seoDescription} onChange={e => setStoreForm({...storeForm, seoDescription: e.target.value})} margin="normal" multiline rows={3} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Google Analytics ID" value={storeForm.google_analytics_id} onChange={e => setStoreForm({...storeForm, google_analytics_id: e.target.value})} margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Google Search Console ID" value={storeForm.google_search_console_id} onChange={e => setStoreForm({...storeForm, google_search_console_id: e.target.value})} margin="normal" />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Divisão Automática de Receita (Revenue Split)</Typography>
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                Configure a proporção para cada venda (a soma exata deve ser 1.0, por exemplo, 0.20 = 20%).
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Plataforma" value={storeForm.splitPlatform} onChange={e => setStoreForm({...storeForm, splitPlatform: e.target.value})} margin="normal" type="number" inputProps={{ step: 0.01 }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Seu Lucro (Dropshipper)" value={storeForm.splitDropshipper} onChange={e => setStoreForm({...storeForm, splitDropshipper: e.target.value})} margin="normal" type="number" inputProps={{ step: 0.01 }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Artesão / Produtor" value={storeForm.splitProducer} onChange={e => setStoreForm({...storeForm, splitProducer: e.target.value})} margin="normal" type="number" inputProps={{ step: 0.01 }} />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" color="success" size="large" onClick={handleSaveStore} sx={{ px: 4, borderRadius: 2.5, fontWeight: 'bold' }}>
                  Salvar Loja
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Dynamic Storefront Visual Customizer Live Preview */}
          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, height: '100%', position: 'sticky', top: 20 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <PreviewIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Visualização ao Vivo (Storefront Mockup)</Typography>
              </Box>

              {/* Mockup Frame */}
              <Box sx={{ 
                border: '8px solid #333', 
                borderRadius: 4, 
                overflow: 'hidden', 
                bgcolor: 
                  storeForm.visualPreset === 'forest_light' ? '#f4fcf6' : 
                  storeForm.visualPreset === 'modern_dark' ? '#121212' : '#fdfaf2',
                color: storeForm.visualPreset === 'modern_dark' ? '#e0e0e0' : '#3d2b1f',
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }}>
                {/* Browser bar */}
                <Box sx={{ bgcolor: '#eee', py: 1, px: 2, display: 'flex', gap: 1, alignItems: 'center', borderBottom: '1px solid #ddd' }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27c93f' }} />
                  <Box sx={{ bgcolor: 'white', borderRadius: 1, px: 2, py: 0.2, fontSize: 10, width: '70%', ml: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#666' }}>
                    arpt.site/store/{storeForm.slug || 'sua-loja'}
                  </Box>
                </Box>

                {/* Banner Preview */}
                <Box sx={{ 
                  bgcolor: storeForm.primaryColor || '#58820F', 
                  color: 'white', 
                  py: 4, 
                  textAlign: 'center',
                  boxShadow: 'inset 0 -10px 10px rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {storeForm.name || 'Nome da sua Loja'}
                  </Typography>
                  {storeForm.aiSlogan && (
                    <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', opacity: 0.9, mt: 0.5, px: 2 }}>
                      "{storeForm.aiSlogan}"
                    </Typography>
                  )}
                </Box>

                {/* Showcase Mock Grid */}
                <Box sx={{ p: 2, flexGrow: 1 }}>
                  <Grid container spacing={2}>
                    {[
                      { nome: 'Escultura de Cedro', preco: 180 },
                      { nome: 'Mesa Lateral Orgânica', preco: 450 }
                    ].map((p, i) => {
                      const finalPrice = (p.preco * (1 + (Number(storeForm.globalMarkupPercentage) || 0) / 100)).toFixed(2);
                      return (
                        <Grid item xs={6} key={i}>
                          <Card variant="outlined" sx={{ 
                            borderRadius: 2,
                            bgcolor: storeForm.visualPreset === 'modern_dark' ? '#1e1e1e' : '#ffffff',
                            color: 'inherit',
                            borderColor: storeForm.visualPreset === 'modern_dark' ? '#333' : '#e0e0e0'
                          }}>
                            <Box sx={{ height: 60, bgcolor: storeForm.visualPreset === 'modern_dark' ? '#2d2d2d' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <StorefrontIcon sx={{ opacity: 0.2 }} />
                            </Box>
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }} noWrap>{p.nome}</Typography>
                              
                              {/* Stock dynamic preview badge */}
                              <Chip 
                                label={i === 0 ? "Em Estoque" : "Sob Encomenda"} 
                                size="small" 
                                color={i === 0 ? "success" : "warning"}
                                sx={{ height: 16, fontSize: 8, my: 0.5 }}
                              />

                              <Typography variant="caption" display="block" sx={{ 
                                color: storeForm.visualPreset === 'modern_dark' ? '#4caf50' : storeForm.primaryColor,
                                fontWeight: 'bold'
                              }}>
                                R$ {finalPrice}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* TAB 1: PRODUCT CATALOG & AVAILABILITY STATUS BADGES */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={4}>
          {/* Your active catalog products */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Seu Catálogo Selecionado</Typography>
              {catalog.length === 0 ? (
                <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  Nenhum produto adicionado ainda. Escolha produtos da lista à direita!
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {catalog.map(prod => (
                    <Grid item xs={12} key={prod.id}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{prod.nome}</Typography>
                          
                          {/* Availability badge */}
                          <Box sx={{ mt: 0.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="caption" color="textSecondary">Preço Original: R$ {prod.preco}</Typography>
                            {prod.availability_type === 'sob_encomenda' ? (
                              <Chip size="small" label={`Sob Encomenda (${prod.production_time_days} dias)`} color="warning" sx={{ height: 20 }} />
                            ) : (
                              <Chip size="small" label="Em Estoque" color="success" sx={{ height: 20 }} />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* Available products list to select */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Adicionar Produtos</Typography>
                <TextField 
                  size="small" 
                  placeholder="Pesquisar..." 
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase();
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
                      <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ p: 2, flexGrow: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} noWrap>{prod.nome}</Typography>
                          <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>R$ {prod.preco}</Typography>
                          
                          {/* Availability badge */}
                          <Box sx={{ mt: 1 }}>
                            {prod.availability_type === 'sob_encomenda' ? (
                              <Chip size="small" label={`Sob Encomenda (${prod.production_time_days}d)`} color="warning" sx={{ height: 18 }} />
                            ) : (
                              <Chip size="small" label="Em Estoque" color="success" sx={{ height: 18 }} />
                            )}
                          </Box>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button 
                            size="small" 
                            variant="outlined"
                            fullWidth
                            disabled={inCatalog} 
                            onClick={() => handleAddProduct(prod.id)}
                            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 'bold' }}
                          >
                            {inCatalog ? 'Já no Catálogo' : 'Adicionar'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* TAB 2: SALES & COMMISSION RECORDS */}
      <TabPanel value={tabValue} index={2}>
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
           <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Vendas e Comissões Ecológicas</Typography>
           <Grid container spacing={3} sx={{ mb: 4 }}>
             <Grid item xs={12} sm={4}>
               <Card variant="outlined" sx={{ bgcolor: 'rgba(88, 130, 15, 0.05)', borderColor: 'rgba(88, 130, 15, 0.2)' }}>
                 <CardContent>
                   <Typography variant="subtitle2" color="textSecondary">Total de Peças Vendidas</Typography>
                   <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>{sales.length}</Typography>
                 </CardContent>
               </Card>
             </Grid>
             <Grid item xs={12} sm={4}>
               <Card variant="outlined" sx={{ bgcolor: 'rgba(46, 125, 50, 0.05)', borderColor: 'rgba(46, 125, 50, 0.2)' }}>
                 <CardContent>
                   <Typography variant="subtitle2" color="textSecondary">Comissão Acumulada</Typography>
                   <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#2e7d32' }}>
                     R$ {sales.reduce((sum, s) => sum + (Number(s.split_dropshipper) || 0), 0).toFixed(2)}
                   </Typography>
                 </CardContent>
               </Card>
             </Grid>
           </Grid>
           
           <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Histórico Recente de Transações</Typography>
           {sales.length === 0 ? (
             <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
               Ainda não há vendas registradas para a sua loja.
             </Typography>
           ) : (
             <Box>
               {sales.map(sale => (
                 <Box key={sale.id} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', py: 2, alignItems: 'center' }}>
                   <Box>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{sale.user_name || 'Comprador Anônimo'}</Typography>
                     <Typography variant="caption" color="textSecondary">Qtd: {sale.qtd} • Pedido #{sale.id}</Typography>
                   </Box>
                   <Box sx={{ textAlign: 'right' }}>
                     <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                       + R$ {Number(sale.split_dropshipper).toFixed(2)}
                     </Typography>
                     <Typography variant="caption" color="textSecondary">
                       {new Date(sale.created_at).toLocaleDateString()}
                     </Typography>
                   </Box>
                 </Box>
               ))}
             </Box>
           )}
        </Paper>
      </TabPanel>

      {/* TAB 3: MARKETING HUB & COPYWRITING ASSETS */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={4}>
          {/* Select Catalog Product for Marketing */}
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Escolha um Produto
              </Typography>
              {catalog.length === 0 ? (
                <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  Adicione produtos ao seu catálogo primeiro!
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {catalog.map(prod => (
                    <Button 
                      key={prod.id} 
                      variant={selectedMarketingProduct?.id === prod.id ? "contained" : "outlined"}
                      onClick={() => setSelectedMarketingProduct(prod)}
                      fullWidth
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none', 
                        borderRadius: 2, 
                        py: 1.5,
                        fontWeight: 'bold' 
                      }}
                    >
                      {prod.nome}
                    </Button>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Social Copywriting & Media Downloads display */}
          <Grid item xs={12} md={8}>
            {selectedMarketingProduct ? (
              <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Marketing Kit: {selectedMarketingProduct.nome}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 4 }}>
                  Use estas cópias geradas por IA e imagens de alta definição para as suas redes sociais.
                </Typography>

                {/* AI Copywriting Widget Card */}
                <Card variant="outlined" sx={{ mb: 4, borderRadius: 3, bgcolor: '#fafafa' }}>
                  <CardHeader 
                    title="Copywriting Sugerido para Redes Sociais" 
                    titleTypographyProps={{ variant: 'subtitle2', sx: { fontWeight: 'bold' } }}
                    action={
                      <Button 
                        size="small" 
                        startIcon={<ContentCopyIcon />}
                        onClick={() => handleCopyText(marketingAssets?.marketing_copy || `${selectedMarketingProduct.nome}: Um produto com design exclusivo e de origem certificada na floresta Amazônica.`)}
                        sx={{ textTransform: 'none', fontWeight: 'bold' }}
                      >
                        Copiar
                      </Button>
                    }
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#444', lineHeight: 1.6 }}>
                      {marketingAssets?.marketing_copy || 
                        `🍃 Traga a beleza natural e a essência da Amazônia para a sua casa! O(A) ${selectedMarketingProduct.nome} é produzido com manejo florestal 100% regulado e design atemporal. Cada peça conta uma história de sustentabilidade e conservação florestal. Compre e ajude a manter a floresta em pé!`
                      }
                    </Typography>
                  </CardContent>
                </Card>

                {/* High Resolution Media Download Assets */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Imagens e Banners Promocionais
                </Typography>

                {marketingAssets?.marketing_assets ? (
                  <Grid container spacing={3}>
                    {marketingAssets.marketing_assets.split(',').map((url, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                          <CardMedia 
                            component="img"
                            height="160"
                            image={url.trim()}
                            alt={`Banner ${i}`}
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardActions sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5 }}>
                            <Button 
                              size="small" 
                              startIcon={<CloudDownloadIcon />}
                              onClick={() => handleDownloadAsset(url.trim())}
                              sx={{ textTransform: 'none', fontWeight: 'bold' }}
                            >
                              Download HD
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Ainda não há arquivos de imagem promocionais de alta definição para este produto. Você pode usar a foto principal do catálogo.
                  </Alert>
                )}
              </Paper>
            ) : (
              <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  Selecione um produto à esquerda para visualizar e baixar o kit de marketing.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Dynamic AI Generator suggestions review dialog */}
      <Dialog 
        open={aiDialogOpen} 
        onClose={() => setAiDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 2, maxWidth: 550 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="success" /> Sugestões Geradas pela IA
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Revisamos a sua ideia e estruturamos as melhores configurações para o seu sucesso ecológico. Veja a sugestão:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>Nome Sugerido para a Loja</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{aiResult?.storeName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>Slogan da Marca</Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"{aiResult?.slogan}"</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>Visual Preset Layout</Typography>
              <Chip label={aiResult?.visualPreset === 'forest_light' ? 'Forest Light (Eco Clássico)' : aiResult?.visualPreset === 'modern_dark' ? 'Modern Dark (Luxo Noite)' : 'Classic Wood (Tons Quentes)'} color="primary" variant="outlined" size="small" />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>Produtos Curados Recomendados</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                {aiResult?.recommendedProducts && aiResult.recommendedProducts.map((p, i) => (
                  <Chip key={i} label={p} size="small" />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAiDialogOpen(false)} color="inherit" sx={{ fontWeight: 'bold' }}>
            Descartar
          </Button>
          <Button 
            onClick={handleApplyAISuggestion} 
            variant="contained" 
            color="success"
            sx={{ fontWeight: 'bold', borderRadius: 2 }}
          >
            Confirmar e Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
