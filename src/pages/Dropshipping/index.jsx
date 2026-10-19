import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, 
  Switch, FormControlLabel, Tabs, Tab, Divider,
  Card, CardContent, CardMedia, CardActions, Chip,
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, CardHeader, Alert, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { api } from '../../services/api';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PreviewIcon from '@mui/icons-material/Preview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import InfoIcon from '@mui/icons-material/Info';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import UndoIcon from '@mui/icons-material/Undo';
import EmailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/Shield';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Cell
} from 'recharts';

// Papéis da equipe (API: dono | editor | financeiro) e ações do log que o dono pode desfazer.
const ROLE_LABELS = { dono: 'Dono', editor: 'Editor', financeiro: 'Financeiro' };
const REVERSIBLE_ACTIONS = ['PRECO_ALTERADO', 'PRODUTO_ALOCADO', 'PRODUTO_REMOVIDO', 'MEMBRO_PAPEL'];
const ACTION_TEXT = {
  PRECO_ALTERADO: 'Alterou o preço de venda de um produto',
  PRODUTO_ALOCADO: 'Adicionou um produto à loja',
  PRODUTO_REMOVIDO: 'Removeu um produto da loja',
  MEMBRO_PAPEL: 'Alterou o papel de um membro da equipe',
  MEMBRO_REMOVIDO: 'Removeu um membro da equipe',
  LOJA_ATUALIZADA: 'Atualizou os dados da loja',
  LOJA_SUSPENSA: 'Loja suspensa pela administração',
  LOJA_REATIVADA: 'Loja reativada pela administração',
  DONO_TRANSFERIDO: 'Propriedade da loja transferida',
  REVERSAO: 'Reversão de uma ação anterior',
};

// Converte a resposta de /members ({ members, invites }) na lista única exibida na equipe.
const normalizeTeam = ({ members = [], invites = [] }) => [
  ...members.map(m => ({
    key: `m-${m.id}`, id: m.id, kind: 'member', email: m.email || m.user_id,
    status: 'Ativo', role: m.papel,
  })),
  ...invites.map(i => ({
    key: `i-${i.id}`, id: i.id, kind: 'invite', email: i.email,
    status: 'Pendente', role: i.papel,
  })),
];

// Converte uma linha de /actions-log para o formato exibido na trilha de auditoria.
const normalizeLogEntry = (l) => ({
  ...l,
  acao: l.tipo,
  user_email: l.ator_user_id,
  reversivel: REVERSIBLE_ACTIONS.includes(l.tipo) && !l.revertida_por,
});


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
    aiSlogan: '',
    custom_domain: ''
  });


  const [catalog, setCatalog] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);


  const [members, setMembers] = useState([]);
  const [actionsLog, setActionsLog] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });


  useEffect(() => {
    if (store?.id && tabValue === 5) {
      fetchStoreTeam(store.id);
    }
  }, [store?.id, tabValue]);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/dropshipping/stores');
      const stores = res.data.map((st) => ({ ...st, name: st.nome, config: {} }));
      
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
          aiSlogan: myStore.ai_slogan || '',
          custom_domain: myStore.custom_domain || ''
        });

        if (myStore.custom_domain) {
        } else {
          setDomainStatus('none');
        }

        // Fetch products and team
        fetchCatalog(myStore.id);
        fetchStoreTeam(myStore.id);
      }
      
      // Fetch all available products to pick from
      const prodRes = await api.get('/produtos');
      setAvailableProducts((prodRes.data || []).filter((p) => p.is_ativo));
    } catch (error) {
      console.error("Error fetching dropshipping data", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalog = async (storeId) => {
    try {
      const res = await api.get(`/api/v1/dropshipping/stores/${storeId}/products`);
      setCatalog(res.data.map((p) => ({ ...p, id: p.produto_id, name: p.nome, price: p.preco_venda })));
    } catch (err) {
      console.error("Error fetching catalog", err);
    }
  };


  const fetchStoreTeam = async (storeId) => {
    try {
      const [membersRes, logsRes] = await Promise.all([
        api.get(`/api/v1/dropshipping/stores/${storeId}/members`),
        api.get(`/api/v1/dropshipping/stores/${storeId}/actions-log`)
      ]);
      setMembers(normalizeTeam(membersRes.data));
      setActionsLog(logsRes.data.map(normalizeLogEntry));
    } catch (err) {
      console.error("Error fetching team/logs", err);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return alert("Por favor, informe o e-mail");
    setInviting(true);
    try {
      await api.post(`/api/v1/dropshipping/stores/${store.id}/members/invite`, {
        email: inviteEmail.trim(),
        papel: inviteRole
      });
      alert("Convite enviado com sucesso!");
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('editor');
      fetchStoreTeam(store.id);
    } catch (err) {
      alert("Erro ao enviar convite: " + (err.response?.data?.error || err.message));
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvite = async (inviteId) => {
    try {
      await api.post(`/api/v1/dropshipping/stores/${store.id}/invites/${inviteId}/resend`);
      alert("Convite reenviado com sucesso!");
      fetchStoreTeam(store.id);
    } catch (err) {
      alert("Erro ao reenviar convite: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await api.put(`/api/v1/dropshipping/stores/${store.id}/members/${memberId}`, {
        papel: newRole
      });
      alert("Cargo atualizado com sucesso!");
      fetchStoreTeam(store.id);
    } catch (err) {
      alert("Erro ao atualizar cargo: " + (err.response?.data?.error || err.message));
    }
  };

  const handleRemoveMember = async (member) => {
    const isInvite = member.kind === 'invite';
    if (!window.confirm(isInvite ? "Deseja cancelar este convite?" : "Deseja realmente remover este membro da equipe?")) return;
    try {
      await api.delete(`/api/v1/dropshipping/stores/${store.id}/${isInvite ? 'invites' : 'members'}/${member.id}`);
      alert("Membro removido com sucesso!");
      fetchStoreTeam(store.id);
    } catch (err) {
      alert("Erro ao remover membro: " + (err.response?.data?.error || err.message));
    }
  };

  const handleRevertAction = async (logId) => {
    if (!window.confirm("Deseja realmente reverter esta alteração? Isso modificará o banco de dados para o estado anterior da ação.")) return;
    try {
      await api.post(`/api/v1/dropshipping/stores/${store.id}/actions-log/${logId}/revert`);
      alert("Ação revertida com sucesso!");
      // Full refresh to ensure consistency of catalog, store data, members, and logs
      await fetchStoreData();
      if (store?.id) {
        await fetchStoreTeam(store.id);
      }
    } catch (err) {
      alert("Erro ao reverter ação: " + (err.response?.data?.error || err.message));
    }
  };

  const handleSaveStore = async () => {
    try {
      // Contrato real: nome e slug na criação; nome na atualização. Aparência e SEO entram na change de vitrine.
      if (!store) {
        const res = await api.post('/api/v1/dropshipping/stores', { nome: storeForm.name, slug: storeForm.slug });
        setStore({ ...res.data, name: res.data.nome });
        alert("Loja criada com sucesso!");
      } else {
        const res = await api.put(`/api/v1/dropshipping/stores/${store.id}`, { nome: storeForm.name });
        setStore({ ...res.data, name: res.data.nome });
        alert("Loja atualizada com sucesso!");
      }
    } catch (error) {
      console.error("Error saving store", error);
      alert("Erro ao salvar loja: " + (error.response?.data?.error || error.message));
    }
  };

  const handleAddProduct = async (produto) => {
    if (!store) return alert("Crie a loja primeiro");
    const sugerido = (Number(produto.preco) * 1.3).toFixed(2);
    const entrada = window.prompt(`Preço de venda para "${produto.nome}" (R$):`, sugerido);
    if (entrada === null) return;
    const precoVenda = Number(entrada.replace(',', '.'));
    if (!(precoVenda > 0)) return alert("Informe um preço de venda válido.");
    try {
      await api.post(`/api/v1/dropshipping/stores/${store.id}/products`, { produto_id: produto.id, preco_venda: precoVenda });
      fetchCatalog(store.id);
    } catch (error) {
      alert("Erro ao adicionar produto: " + (error.response?.data?.error || error.message));
    }
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
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.4rem', sm: '2rem' } }}>Dashboard Dropshipping</Typography>
          <Typography variant="caption" color="textSecondary">
            Gerencie sua marca, cure catálogos de origem Amazônica e impulsione suas vendas verdes.
          </Typography>
        </Box>
        <Chip icon={<StorefrontIcon />} label={store ? `Loja Ativa: ${store.name}` : "Nenhuma loja cadastrada"} color={store ? "success" : "warning"} sx={{ flexShrink: 0 }} />
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ '& .MuiTab-root': { minHeight: 48, py: 1.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } } }}
        >
          <Tab label="Configuração da Loja" value={0} />
          <Tab label="Catálogo de Curação" value={1} />
          <Tab label="Equipe & Auditoria" value={2} />
        </Tabs>
      </Box>

      {/* TAB 0: CONFIGURATION & LIVE VISUAL PREVIEWER */}
      <TabPanel value={tabValue} index={0}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Nesta versão, o botão Salvar Loja grava nome e slug. Aparência, SEO e rastreio ficam disponíveis com a vitrine da loja.
        </Alert>
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

              <Box sx={{ mt: 4, display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  fullWidth={true}
                  onClick={handleSaveStore}
                  sx={{ px: 4, py: { xs: 1.5, sm: 1 }, borderRadius: 2.5, fontWeight: 'bold', minHeight: 48, maxWidth: { sm: 200 } }}
                >
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
                  Nenhum produto adicionado ainda. Escolha produtos da lista abaixo!
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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Adicionar Produtos</Typography>
                <TextField 
                  size="small" 
                  placeholder="Pesquisar..." 
                  sx={{ minWidth: 140 }}
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
                            onClick={() => handleAddProduct(prod)}
                            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 'bold', minHeight: 40 }}
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




      {/* TAB 2: TEAM MANAGEMENT & AUDIT LOGS */}
      <TabPanel value={tabValue} index={2}>
        {!store ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Você precisa criar e salvar uma loja antes de gerenciar a sua equipe de vendas.
          </Alert>
        ) : (
          <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center', bgcolor: '#f8fafc' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>Total de Membros</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1e293b', mt: 1 }}>
                    {members.filter(m => m.status === 'Ativo').length}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center', bgcolor: '#f8fafc' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>Convites Pendentes</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#fbbf24', mt: 1 }}>
                    {members.filter(m => m.status === 'Pendente').length}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setInviteOpen(true)}
                    sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 'bold', py: 1.2, px: 3 }}
                  >
                    Convidar Membro
                  </Button>
                </Paper>
              </Grid>
            </Grid>

            <Grid container spacing={4}>
              {/* Members List Column */}
              <Grid item xs={12} md={7}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <PeopleIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Equipe da Loja</Typography>
                  </Box>

                  {members.length === 0 ? (
                    <Typography color="textSecondary" sx={{ fontStyle: 'italic', py: 3, textAlign: 'center' }}>
                      Nenhum membro ou convite registrado na equipe desta loja.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {members.map(m => (
                        <Card key={m.key} variant="outlined" sx={{ borderRadius: 2.5, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box 
                              sx={{ 
                                width: 44, 
                                height: 44, 
                                borderRadius: '50%', 
                                bgcolor: m.status === 'Ativo' ? '#dcfce7' : '#fef9c3', 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                color: m.status === 'Ativo' ? '#15803d' : '#a16207',
                                fontWeight: 'bold'
                              }}
                            >
                              {m.first_name ? m.first_name[0].toUpperCase() : <PeopleIcon size="small" />}
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {m.first_name ? `${m.first_name} ${m.last_name || ''}` : 'Convidado Pendente'}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <EmailIcon sx={{ fontSize: 13, color: '#64748b' }} />
                                <Typography variant="caption" color="textSecondary">
                                  {m.email}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Chip 
                              label={m.status} 
                              size="small" 
                              color={m.status === 'Ativo' ? 'success' : 'warning'} 
                              variant="outlined" 
                            />
                            
                            {m.kind === 'member' && m.role !== 'dono' ? (
                              <FormControl size="small" sx={{ minWidth: 110 }}>
                                <Select
                                  value={m.role}
                                  onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                                  sx={{ borderRadius: 1.5, height: 32, fontSize: '0.8rem' }}
                                >
                                  <MenuItem value="editor">{ROLE_LABELS.editor}</MenuItem>
                                  <MenuItem value="financeiro">{ROLE_LABELS.financeiro}</MenuItem>
                                </Select>
                              </FormControl>
                            ) : (
                              <Chip label={ROLE_LABELS[m.role] || m.role} size="small" />
                            )}

                            {m.status === 'Pendente' && (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  onClick={() => handleResendInvite(m.id)}
                                  sx={{ borderRadius: 1.5, height: 32, textTransform: 'none', fontSize: '0.75rem' }}
                                >
                                  Reenviar
                                </Button>
                              </>
                            )}

                            {m.role !== 'dono' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleRemoveMember(m)}
                              sx={{ minWidth: 32, width: 32, height: 32, p: 0, borderRadius: 1.5 }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </Button>
                            )}
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Audit Logs Column */}
              <Grid item xs={12} md={5}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <HistoryIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Trilha de Auditoria (Logs)</Typography>
                  </Box>

                  {actionsLog.length === 0 ? (
                    <Typography color="textSecondary" sx={{ fontStyle: 'italic', py: 3, textAlign: 'center' }}>
                      Nenhuma ação registrada no log de auditoria.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 600, overflowY: 'auto', pr: 0.5 }}>
                      {actionsLog.map(log => {
                        const isReversible = log.reversivel;
                        let actionText = log.acao;
                        let actionColor = 'inherit';

                        if (log.acao === 'REVERSAO') {
                          actionColor = '#dc2626';
                        } else if (REVERSIBLE_ACTIONS.includes(log.acao)) {
                          actionColor = '#2563eb';
                        }
                        actionText = ACTION_TEXT[log.acao] || log.acao;

                        return (
                          <Paper key={log.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: log.acao === 'REVERSAO' ? '#fef2f2' : 'white' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: actionColor }}>
                                {log.acao === 'REVERSAO' ? 'Reversão Efetuada' : 'Ação de Gerenciamento'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(log.created_at).toLocaleString('pt-BR')}
                              </Typography>
                            </Box>

                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {actionText}
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ShieldIcon sx={{ fontSize: 13, color: '#64748b' }} />
                                <Typography variant="caption" color="textSecondary">
                                  Por: {log.first_name ? `${log.first_name} ${log.last_name || ''}` : log.user_email}
                                </Typography>
                              </Box>

                              {isReversible && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="warning"
                                  startIcon={<UndoIcon />}
                                  onClick={() => handleRevertAction(log.id)}
                                  sx={{ borderRadius: 1.5, py: 0.4, textTransform: 'none', fontSize: '0.7rem', fontWeight: 'bold' }}
                                >
                                  Desfazer
                                </Button>
                              )}
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {/* Invitation Dialog Modal */}
            <Dialog 
              open={inviteOpen} 
              onClose={() => setInviteOpen(false)}
              PaperProps={{ sx: { borderRadius: 4, p: 2, maxWidth: 450, width: '100%' } }}
            >
              <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAddIcon color="success" /> Convidar Novo Membro
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Envie um convite por e-mail para cadastrar um novo integrante na equipe de vendas da sua loja.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                  <TextField
                    fullWidth
                    label="Endereço de E-mail"
                    variant="outlined"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="nome@exemplo.com"
                  />

                  <FormControl fullWidth>
                    <InputLabel>Papel na Equipe</InputLabel>
                    <Select
                      value={inviteRole}
                      label="Papel na Equipe"
                      onChange={e => setInviteRole(e.target.value)}
                    >
                      <MenuItem value="editor">Editor (Catálogo, Aparência, Marketing)</MenuItem>
                      <MenuItem value="financeiro">Financeiro (Relatórios e Repasses)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setInviteOpen(false)} color="inherit" sx={{ fontWeight: 'bold' }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleInviteMember} 
                  variant="contained" 
                  color="success"
                  disabled={inviting}
                  sx={{ fontWeight: 'bold', borderRadius: 2 }}
                >
                  {inviting ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
      </TabPanel>
    </Box>
  );
}
