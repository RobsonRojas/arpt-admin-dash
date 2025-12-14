import React, { useState, useMemo, useEffect } from 'react';
import { 
  createTheme, ThemeProvider, CssBaseline, Box, Drawer, AppBar, Toolbar, List, 
  Typography, Divider, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Grid, Paper, Chip, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Avatar, Button, Alert, Stack, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Stepper, Step, StepLabel,
  TextField, MenuItem, Switch, FormControlLabel, Card, CardContent, CardActions
} from '@mui/material';
import { 
  Dashboard, FolderOpen, People, Menu as MenuIcon,
  Visibility, Map, Verified, Gavel, Close, Landscape, MonetizationOn,
  Assignment, Search, Add, CloudUpload, ArrowBack, ArrowForward, CheckCircle,
  AccountBalanceWallet, EmojiEvents, History, Business, Email, Phone,
  Forest, Warning, Rule, WhatsApp
} from '@mui/icons-material';

// =============================================================================
// 1. CONSTANTES & DADOS MOCKADOS
// =============================================================================

const CONSTANTS = {
  ESTADOS: ["Amazonas", "Pará", "Acre", "Rondônia", "Mato Grosso", "Amapá", "Roraima", "Tocantins", "Maranhão"],
  UNIDADES: ["ha", "m²", "km²"],
  SPECIES_DB: {
    "Paxiúba": { scientific: "Socratea exorrhiza", ff: 0.9, type: "Palmeira" },
    "Açaí": { scientific: "Euterpe oleracea", ff: 0.85, type: "Palmeira" },
    "Angelim": { scientific: "Hymenolobium petraeum", ff: 0.7, type: "Dicotiledônea" },
    "Cumaru": { scientific: "Dipteryx odorata", ff: 0.7, type: "Dicotiledônea" },
    "Outros": { scientific: "N/A", ff: 0.7, type: "Geral" }
  }
};

const INITIAL_PROJECTS = [
  { id: "PROJ-001", status: "Em Análise", descricao: "Manejo de Pirarucu - Solimões", proponente: "Assoc. Ribeirinha Solimões", municipio: "Tefé", tamanho: 1200, unidade_medida: "ha", custo_operacional: 85000, auditoria: { risco: "Baixo", alertas: [] } },
  { id: "PROJ-002", status: "Aprovado", descricao: "Agrofloresta de Cacau Nativo", proponente: "Coop. Verde Vida", municipio: "Altamira", tamanho: 450, unidade_medida: "ha", custo_operacional: 120000, auditoria: { risco: "Baixo", alertas: [] } }
];

const INITIAL_NECROMASSA = [
  { 
    id: "NECRO-059", 
    solicitante: "João da Silva (Lote 12)", 
    especie_vulgar: "Paxiúba", 
    volume: 0.557, 
    status: "Pendente Correção", 
    data: "2025-11-29",
    coords: { lat: 58.0, lng: 25.0 }, // Erro intencional do relatório (Europa)
    alerts: ["Coordenada fora da Amazônia Legal", "Volume subestimado"],
    origem: "WhatsApp"
  }
];

const MOCK_SPONSORS = [
  {
    id: "SPON-001", nome: "EcoFurniture S.A.", tipo: "Pessoa Jurídica", contato: "compras@ecofurniture.com", nivel: "Ouro", total_patrocinado: 450000, status: "Ativo",
    portfolio: [{ projeto: "Manejo Solimões", valor: 85000, status: "Confirmado" }]
  },
  {
    id: "SPON-002", nome: "Tech Green Corp", tipo: "Pessoa Jurídica", contato: "esg@tech.com", nivel: "Platina", total_patrocinado: 1200000, status: "Ativo",
    portfolio: [{ projeto: "Manejo Madeira", valor: 1200000, status: "Confirmado" }]
  }
];

// =============================================================================
// 2. TEMA & ESTILOS
// =============================================================================

const theme = createTheme({
  palette: {
    primary: { main: '#1b5e20' }, 
    secondary: { main: '#4caf50' }, 
    background: { default: '#f4f6f8', paper: '#ffffff' },
    error: { main: '#d32f2f' },
    warning: { main: '#ed6c02' },
    success: { main: '#2e7d32' },
  },
  typography: { fontFamily: '"Roboto", sans-serif', h5: { fontWeight: 600 }, h6: { fontWeight: 600 } },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none' } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 12 }, elevation1: { boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } } }
  }
});

// =============================================================================
// 3. COMPONENTES AUXILIARES
// =============================================================================

const MapEmbed = ({ lat, lng }) => {
  const isError = lat > 5 || lat < -15 || lng > -40 || lng < -75; // Geofence simples Amazônia
  
  if (isError) {
      return (
          <Box sx={{ width: '100%', height: 250, bgcolor: '#ffebee', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #d32f2f' }}>
              <Map color="error" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" color="error">ALERTA DE GEOFENCE</Typography>
              <Typography variant="body2">Coordenadas ({lat}, {lng}) fora do PA Niterói.</Typography>
              <Typography variant="caption" sx={{mt:1, bgcolor:'#fff', p:0.5, borderRadius:1}}>Localização detectada: Fora da Amazônia Legal</Typography>
          </Box>
      )
  }

  const offset = 0.05;
  const bbox = `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <Box sx={{ width: '100%', height: 250, bgcolor: '#eee', borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
      <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src={src} title="map"></iframe>
    </Box>
  );
};

const StatCard = ({ title, value, subtext, icon, color }) => (
  <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
    <Box>
      <Typography variant="body2" color="textSecondary" gutterBottom fontWeight="bold">{title.toUpperCase()}</Typography>
      <Typography variant="h4" fontWeight="bold" color="#333">{value}</Typography>
      <Typography variant="caption" sx={{ color: color, bgcolor: `${color}15`, px: 1, py: 0.5, borderRadius: 1, mt: 1, display: 'inline-block' }}>
        {subtext}
      </Typography>
    </Box>
    <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: `${color}10`, color: color }}>
      {icon}
    </Box>
  </Paper>
);

const RiskChip = ({ level }) => {
  let color = 'success';
  if (level === 'Médio') color = 'warning';
  if (level === 'Alto') color = 'error';
  return <Chip label={level} color={color} size="small" variant={level === 'Baixo' ? 'outlined' : 'filled'} />;
};

const StatusChip = ({ status }) => {
  const getColor = (s) => {
    switch(s) {
      case 'Aprovado': return 'success';
      case 'Em Análise': return 'info';
      case 'Rejeitado': return 'error';
      case 'Pendente Info': return 'warning';
      default: return 'default';
    }
  };
  return <Chip label={status} color={getColor(status)} size="small" />;
};

// =============================================================================
// 4. VISÕES (MODULES)
// =============================================================================

// --- MÓDULO NECROMASSA (Árvores Caídas) ---
const NecromassaView = () => {
    const [requests, setRequests] = useState(INITIAL_NECROMASSA);
    const [openForm, setOpenForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        solicitante: "", especie_vulgar: "Paxiúba", cap: "", altura: "",
        lat: "", lng: "", fotoRaiz: false, fotoFuste: false
    });

    const [calculatedVolume, setCalculatedVolume] = useState(0);
    const [scientificName, setScientificName] = useState("");

    useEffect(() => {
        const spec = CONSTANTS.SPECIES_DB[formData.especie_vulgar] || CONSTANTS.SPECIES_DB["Outros"];
        setScientificName(spec.scientific);

        if (formData.cap && formData.altura) {
            const capVal = parseFloat(formData.cap);
            const altVal = parseFloat(formData.altura);
            const dap = capVal / Math.PI;
            // Fórmula do relatório: Volume = (pi * DAP^2 / 40000) * H * ff
            const volume = (Math.PI * Math.pow(dap, 2) / 40000) * altVal * spec.ff;
            setCalculatedVolume(volume.toFixed(4));
        } else {
            setCalculatedVolume(0);
        }
    }, [formData.cap, formData.altura, formData.especie_vulgar]);

    const handleSave = () => {
        const lat = parseFloat(formData.lat);
        const lng = parseFloat(formData.lng);
        let alerts = [];
        
        // Geofence check
        if (lat > 5 || lat < -15 || lng > -40 || lng < -75) alerts.push("Coordenada fora da Amazônia");
        if (!formData.fotoRaiz) alerts.push("Falta evidência da raiz (Risco de Fraude)");

        const newReq = {
            id: `NECRO-${Math.floor(Math.random() * 1000)}`,
            solicitante: formData.solicitante,
            especie_vulgar: formData.especie_vulgar,
            volume: calculatedVolume,
            status: alerts.length > 0 ? "Pendente Correção" : "Aprovado p/ IPAAM",
            data: new Date().toISOString().split('T')[0],
            coords: { lat, lng },
            alerts: alerts,
            origem: "WhatsApp"
        };

        setRequests([newReq, ...requests]);
        setOpenForm(false);
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={600} display="flex" alignItems="center" gap={1}>
                        <Forest color="primary" /> Licenciamento de Necromassa
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Gestão de aproveitamento de árvores caídas (PA Niterói)
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<WhatsApp />} color="success" onClick={() => setOpenForm(true)}>
                    Novo Input (WhatsApp)
                </Button>
            </Box>

            <Grid container spacing={3}>
                {requests.map((req) => (
                    <Grid item xs={12} md={6} key={req.id}>
                        <Card sx={{ borderLeft: `6px solid ${req.status.includes('Aprovado') ? '#2e7d32' : '#d32f2f'}` }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="subtitle2" color="textSecondary">{req.id}</Typography>
                                    <Chip label={req.status} color={req.status.includes('Aprovado') ? "success" : "error"} size="small" />
                                </Box>
                                <Typography variant="h6">{req.solicitante}</Typography>
                                <Typography variant="body2" gutterBottom>{req.especie_vulgar} • {req.volume} m³</Typography>
                                
                                {req.alerts.length > 0 && (
                                    <Alert severity="error" sx={{ mt: 2, py: 0 }}>
                                        <ul style={{margin: '4px 0', paddingLeft: '20px'}}>
                                            {req.alerts.map((a, i) => <li key={i}><Typography variant="caption">{a}</Typography></li>)}
                                        </ul>
                                    </Alert>
                                )}
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end', bgcolor: '#f5f5f5' }}>
                                <Button size="small" startIcon={<Visibility />} onClick={() => setSelectedRequest(req)}>Auditar</Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* MODAL INPUT WHATSAPP */}
            <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>Input Técnico (Origem: WhatsApp)</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3} sx={{ mt: 0 }}>
                        <Grid item xs={12}>
                            <Alert severity="info" icon={<WhatsApp />}>Transcreva os dados enviados pelo assentado. O sistema calculará o volume e validará as coordenadas.</Alert>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Assentado / Lote" value={formData.solicitante} onChange={e => setFormData({...formData, solicitante: e.target.value})} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField select fullWidth label="Espécie" value={formData.especie_vulgar} onChange={e => setFormData({...formData, especie_vulgar: e.target.value})}>
                                {Object.keys(CONSTANTS.SPECIES_DB).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </TextField>
                            <Typography variant="caption">Científico: {scientificName}</Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <TextField fullWidth type="number" label="CAP (cm)" value={formData.cap} onChange={e => setFormData({...formData, cap: e.target.value})} />
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <TextField fullWidth type="number" label="Altura (m)" value={formData.altura} onChange={e => setFormData({...formData, altura: e.target.value})} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, bgcolor: '#e8f5e9', textAlign: 'center' }}>
                                <Typography variant="caption">Volume Estimado</Typography>
                                <Typography variant="h5" color="primary" fontWeight="bold">{calculatedVolume} m³</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Latitude" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Longitude" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel control={<Switch checked={formData.fotoRaiz} onChange={e => setFormData({...formData, fotoRaiz: e.target.checked})} />} label="Foto mostra raiz exposta?" />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave}>Salvar</Button>
                </DialogActions>
            </Dialog>

            {/* DRAWER AUDITORIA NECROMASSA */}
            <Drawer anchor="right" open={Boolean(selectedRequest)} onClose={() => setSelectedRequest(null)} PaperProps={{ sx: { width: { xs: '100%', md: 500 } } }}>
                {selectedRequest && (
                    <Box p={3}>
                        <Typography variant="h6">Auditoria Técnica {selectedRequest.id}</Typography>
                        <Divider sx={{ my: 2 }} />
                        <MapEmbed lat={selectedRequest.coords.lat} lng={selectedRequest.coords.lng} />
                        <List>
                            <ListItem><ListItemText primary="Solicitante" secondary={selectedRequest.solicitante} /></ListItem>
                            <ListItem><ListItemText primary="Espécie" secondary={selectedRequest.especie_vulgar} /></ListItem>
                            <ListItem><ListItemText primary="Volume Calculado" secondary={`${selectedRequest.volume} m³`} /></ListItem>
                        </List>
                        {selectedRequest.alerts.length > 0 ? (
                            <Button fullWidth variant="outlined" color="error" startIcon={<Warning />}>Notificar Correção</Button>
                        ) : (
                            <Button fullWidth variant="contained" color="success" startIcon={<Rule />}>Gerar Doc. IPAAM</Button>
                        )}
                    </Box>
                )}
            </Drawer>
        </Box>
    );
};

// --- MÓDULO SPONSORS ---
const SponsorsView = () => {
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>Gestão de Patrocinadores (RWA)</Typography>
        <Button variant="contained" startIcon={<AccountBalanceWallet />}>Nova Captação</Button>
      </Box>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f9fafb' }}>
            <TableRow>
                <TableCell>Patrocinador</TableCell><TableCell>Nível</TableCell><TableCell>Total Patrocinado</TableCell><TableCell align="right">Ação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_SPONSORS.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                    <Box display="flex" gap={2} alignItems="center">
                        <Avatar>{row.nome[0]}</Avatar>
                        <Box><Typography fontWeight="bold">{row.nome}</Typography><Typography variant="caption">{row.tipo}</Typography></Box>
                    </Box>
                </TableCell>
                <TableCell><Chip label={row.nivel} size="small" color={row.nivel === 'Platina' ? 'info' : 'warning'} /></TableCell>
                <TableCell><Typography color="success.main" fontWeight="bold">R$ {row.total_patrocinado.toLocaleString()}</Typography></TableCell>
                <TableCell align="right"><IconButton onClick={() => setSelectedSponsor(row)}><Visibility /></IconButton></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Drawer simples para detalhes */}
      <Drawer anchor="right" open={Boolean(selectedSponsor)} onClose={() => setSelectedSponsor(null)}>
          <Box p={3} width={400}>
              <Typography variant="h6">Detalhes do Patrocinador</Typography>
              {selectedSponsor && (
                  <List>
                      <ListItem><ListItemText primary="Nome" secondary={selectedSponsor.nome} /></ListItem>
                      <ListItem><ListItemText primary="Contato" secondary={selectedSponsor.contato} /></ListItem>
                      <Divider />
                      <Typography variant="subtitle2" sx={{mt:2}}>Portfolio</Typography>
                      {selectedSponsor.portfolio.map((p, i) => (
                          <ListItem key={i}><ListItemText primary={p.projeto} secondary={`R$ ${p.valor.toLocaleString()} - ${p.status}`} /></ListItem>
                      ))}
                  </List>
              )}
          </Box>
      </Drawer>
    </Box>
  );
};

// --- MÓDULO FIELD APP EMBEDDED ---
const FieldAppEmbedded = ({ onClose, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({ descricao: "", municipio: "Tefé", tamanho: "", custo: "" });
  const steps = ['Dados', 'Revisão'];

  return (
    <Box>
       <Stepper activeStep={activeStep} alternativeLabel>{steps.map(l => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}</Stepper>
       <Box sx={{ minHeight: 200, mt: 2 }}>
          {activeStep === 0 ? (
              <Grid container spacing={2}>
                  <Grid item xs={12}><TextField fullWidth label="Nome do Projeto" value={formData.descricao} onChange={e=>setFormData({...formData, descricao: e.target.value})} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Município" value={formData.municipio} onChange={e=>setFormData({...formData, municipio: e.target.value})} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Tamanho (ha)" type="number" value={formData.tamanho} onChange={e=>setFormData({...formData, tamanho: e.target.value})} /></Grid>
                  <Grid item xs={12}><TextField fullWidth label="Custo Operacional (R$)" type="number" value={formData.custo} onChange={e=>setFormData({...formData, custo: e.target.value})} /></Grid>
              </Grid>
          ) : (
              <Alert severity="info">Confirme os dados: {formData.descricao} em {formData.municipio}, {formData.tamanho} ha.</Alert>
          )}
       </Box>
       <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button disabled={activeStep === 0} onClick={()=>setActiveStep(0)}>Voltar</Button>
          {activeStep === 0 ? <Button variant="contained" onClick={()=>setActiveStep(1)}>Próximo</Button> : <Button variant="contained" color="success" onClick={() => onSave({...formData, id: "NEW-001", status: "Em Análise", auditoria: {risco: "Baixo"}})}>Finalizar</Button>}
       </Box>
    </Box>
  );
};

// =============================================================================
// 5. APLICAÇÃO PRINCIPAL (ORQUESTRADOR)
// =============================================================================

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openCadastro, setOpenCadastro] = useState(false);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  
  // Estados para Filtro de Projetos
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  
  const [selectedProject, setSelectedProject] = useState(null);

  // --- STATS GERAIS ---
  const stats = useMemo(() => ({
      area: 1650, investimento: 205000, pendentes: 1, aprovados: 1
  }), []);

  // Lógica de Filtros
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (project.descricao?.toLowerCase().includes(searchLower) || false) ||
        (project.municipio?.toLowerCase().includes(searchLower) || false);
      const matchesStatus = filterStatus === "Todos" ? true : project.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, filterStatus]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  
  const handleStatusChange = (id, newStatus) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    setSelectedProject(prev => ({ ...prev, status: newStatus }));
    if(newStatus === 'Aprovado' || newStatus === 'Rejeitado') setSelectedProject(null);
  };

  const drawerContent = (
    <div>
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Landscape sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap>ARPT Admin</Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding><ListItemButton selected={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')}><ListItemIcon><Dashboard /></ListItemIcon><ListItemText primary="Sala de Situação" /></ListItemButton></ListItem>
        <ListItem disablePadding><ListItemButton selected={currentView === 'necromassa'} onClick={() => setCurrentView('necromassa')}><ListItemIcon><Forest /></ListItemIcon><ListItemText primary="Necromassa (Árvores)" /></ListItemButton></ListItem>
        <ListItem disablePadding><ListItemButton selected={currentView === 'projects'} onClick={() => setCurrentView('projects')}><ListItemIcon><FolderOpen /></ListItemIcon><ListItemText primary="Projetos Manejo" /></ListItemButton></ListItem>
        <ListItem disablePadding><ListItemButton selected={currentView === 'sponsors'} onClick={() => setCurrentView('sponsors')}><ListItemIcon><People /></ListItemIcon><ListItemText primary="Patrocinadores" /></ListItemButton></ListItem>
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ width: { sm: `calc(100% - 240px)` }, ml: { sm: '240px' }, bgcolor: 'white', color: 'text.primary', boxShadow: 1 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}><MenuIcon /></IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {currentView === 'dashboard' ? 'Visão Geral' : currentView === 'necromassa' ? 'Gestão de Necromassa' : currentView === 'sponsors' ? 'Patrocinadores' : 'Gestão de Projetos'}
            </Typography>
            <IconButton><Avatar sx={{ bgcolor: 'secondary.main' }}>A</Avatar></IconButton>
          </Toolbar>
        </AppBar>
        <Box component="nav" sx={{ width: { sm: 240 }, flexShrink: { sm: 0 } }}>
          <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 } }}>{drawerContent}</Drawer>
          <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 } }} open>{drawerContent}</Drawer>
        </Box>
        <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
          <Toolbar />
          
          {currentView === 'dashboard' && (
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Área Total" value={`${stats.area} ha`} subtext="Sob Gestão" color="#2e7d32" icon={<Landscape />} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Investimento" value={`R$ ${stats.investimento}`} subtext="Total" color="#0288d1" icon={<MonetizationOn />} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Pendências" value={stats.pendentes} subtext="Projetos" color="#ed6c02" icon={<Assignment />} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="RWA Ativos" value={stats.aprovados} subtext="Tokenizados" color="#9c27b0" icon={<Verified />} /></Grid>
            </Grid>
          )}

          {currentView === 'necromassa' && <NecromassaView />}
          
          {currentView === 'projects' && (
              <Box>
                  <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
                    <Toolbar sx={{ pl: 0, pr: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <TextField 
                        label="Buscar projeto..." 
                        size="small" 
                        value={searchTerm} 
                        onChange={(e)=>setSearchTerm(e.target.value)} 
                        InputProps={{startAdornment:<Search sx={{mr:1, color:'action.active'}}/>}}
                        sx={{flexGrow:1}}
                      />
                      <TextField select label="Status" size="small" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} sx={{minWidth:150}}>
                          <MenuItem value="Todos">Todos</MenuItem>
                          <MenuItem value="Em Análise">Em Análise</MenuItem>
                          <MenuItem value="Aprovado">Aprovado</MenuItem>
                      </TextField>
                      <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCadastro(true)}>Novo</Button>
                    </Toolbar>
                  </Paper>

                  <TableContainer component={Paper}>
                      <Table>
                          <TableHead><TableRow><TableCell>Projeto</TableCell><TableCell>Status</TableCell><TableCell>Custo</TableCell><TableCell align="right">Ação</TableCell></TableRow></TableHead>
                          <TableBody>
                              {filteredProjects.map(p => (
                                  <TableRow key={p.id}>
                                      <TableCell>
                                          <Typography variant="body2" fontWeight="bold">{p.descricao}</Typography>
                                          <Typography variant="caption">{p.municipio}</Typography>
                                      </TableCell>
                                      <TableCell><StatusChip status={p.status} /></TableCell>
                                      <TableCell>R$ {p.custo_operacional}</TableCell>
                                      <TableCell align="right"><IconButton size="small" onClick={()=>setSelectedProject(p)}><Visibility /></IconButton></TableCell>
                                  </TableRow>
                              ))}
                              {filteredProjects.length === 0 && <TableRow><TableCell colSpan={4} align="center">Nenhum projeto encontrado</TableCell></TableRow>}
                          </TableBody>
                      </Table>
                  </TableContainer>
              </Box>
          )}

          {currentView === 'sponsors' && <SponsorsView />}

          <Dialog open={openCadastro} onClose={() => setOpenCadastro(false)} fullWidth maxWidth="md">
             <DialogTitle>Novo Cadastro de Manejo</DialogTitle>
             <DialogContent><FieldAppEmbedded onClose={() => setOpenCadastro(false)} onSave={(p) => { setProjects([...projects, p]); setOpenCadastro(false); }} /></DialogContent>
          </Dialog>

          {/* DRAWER DETALHES PROJETO */}
          <Drawer anchor="right" open={Boolean(selectedProject)} onClose={() => setSelectedProject(null)} PaperProps={{ sx: { width: { xs: '100%', md: 500 } } }}>
            {selectedProject && (
              <Box p={3} display="flex" flexDirection="column" height="100%">
                <Typography variant="h6">{selectedProject.descricao}</Typography>
                <Divider sx={{my:2}} />
                <Box flexGrow={1}>
                    <MapEmbed lat={-3.354} lng={-64.712} /> {/* Mock coord */}
                    <List>
                        <ListItem><ListItemText primary="Proponente" secondary={selectedProject.proponente} /></ListItem>
                        <ListItem><ListItemText primary="Área" secondary={`${selectedProject.tamanho} ${selectedProject.unidade_medida}`} /></ListItem>
                        <ListItem><ListItemText primary="Risco Auditoria" secondary={<RiskChip level={selectedProject.auditoria.risco} />} /></ListItem>
                    </List>
                </Box>
                <Box sx={{mt:2, display:'flex', gap:2, justifyContent:'flex-end'}}>
                    {selectedProject.status === 'Em Análise' && (
                        <>
                            <Button variant="outlined" color="error" onClick={()=>handleStatusChange(selectedProject.id, 'Rejeitado')}>Rejeitar</Button>
                            <Button variant="contained" color="success" onClick={()=>handleStatusChange(selectedProject.id, 'Aprovado')}>Aprovar</Button>
                        </>
                    )}
                </Box>
              </Box>
            )}
          </Drawer>

        </Box>
      </Box>
    </ThemeProvider>
  );
}
