import React, { useState, useMemo } from 'react';
import { 
  createTheme, ThemeProvider, CssBaseline, Box, Drawer, AppBar, Toolbar, List, 
  Typography, Divider, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Grid, Paper, Chip, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Avatar, Button, Alert, Stack, LinearProgress,
  Dialog, DialogTitle, DialogContent, Stepper, Step, StepLabel,
  TextField, MenuItem
} from '@mui/material';
import { 
  Dashboard, FolderOpen, People, Menu as MenuIcon,
  Visibility, Map, Verified, Gavel, Close, Landscape, MonetizationOn,
  Assignment, Search, Add, CloudUpload, ArrowBack, ArrowForward, CheckCircle,
  AccountBalanceWallet, EmojiEvents, History, Business, Email, Phone
} from '@mui/icons-material';

// --- CONSTANTES ---
const CONSTANTS = {
  ESTADOS: ["Amazonas", "Pará", "Acre", "Rondônia", "Mato Grosso", "Amapá", "Roraima", "Tocantins", "Maranhão"],
  POTENCIAIS: ["Manejo de Madeira", "Preservação de mananciais", "Produtos Não Madeireiros", "Turismo Ecológico", "Créditos de Carbono"],
  UNIDADES: ["ha", "m²", "km²"]
};

// --- MOCK DATA ---
const INITIAL_PROJECTS = [
  {
    id: "PROJ-001",
    status: "Em Análise",
    descricao: "Manejo de Pirarucu - Solimões",
    proponente: "Assoc. Ribeirinha Solimões",
    estado: "Amazonas",
    municipio: "Tefé",
    tamanho: 1200,
    unidade_medida: "ha",
    latitude: -3.354,
    longitude: -64.712,
    potencial: "Manejo de Pesca",
    data_submissao: "2024-02-10",
    custo_operacional: 85000,
    ranking: 8,
    fotos: ["https://picsum.photos/600?random=10"],
    auditoria: { risco: "Baixo", alertas: [] }
  },
  {
    id: "PROJ-002",
    status: "Aprovado",
    descricao: "Agrofloresta de Cacau Nativo",
    proponente: "Coop. Verde Vida",
    estado: "Pará",
    municipio: "Altamira",
    tamanho: 450,
    unidade_medida: "ha",
    latitude: -3.203,
    longitude: -52.206,
    potencial: "Produtos Não Madeireiros",
    data_submissao: "2024-01-15",
    custo_operacional: 120000,
    ranking: 9,
    hash_blockchain: "0x7f83b...3a21",
    fotos: ["https://picsum.photos/600?random=12"],
    auditoria: { risco: "Baixo", alertas: [] }
  },
  {
    id: "PROJ-004",
    status: "Em Análise",
    descricao: "Plano de Manejo Madeireiro",
    proponente: "Madeireira Legal Ltda",
    estado: "Rondônia",
    municipio: "Porto Velho",
    tamanho: 5000,
    unidade_medida: "ha",
    latitude: -8.761,
    longitude: -63.900,
    potencial: "Manejo de Madeira",
    data_submissao: "2024-02-14",
    custo_operacional: 1500000,
    ranking: 7,
    fotos: ["https://picsum.photos/600?random=14"],
    auditoria: { risco: "Alto", alertas: ["Sobreposição com Terra Indígena detectada no CAR"] }
  }
];

const MOCK_SPONSORS = [
  {
    id: "SPON-001",
    nome: "EcoFurniture S.A.",
    tipo: "Pessoa Jurídica",
    contato: "compras@ecofurniture.com",
    nivel: "Ouro",
    total_investido: 450000,
    projetos_apoiados: 3,
    status: "Ativo",
    logo: "https://ui-avatars.com/api/?name=Eco+Furniture&background=2e7d32&color=fff",
    portfolio: [
      { projeto: "Manejo de Pirarucu - Solimões", valor: 85000, data: "2024-02-15", status: "Confirmado" },
      { projeto: "Plano de Manejo Madeireiro", valor: 300000, data: "2024-01-10", status: "Confirmado" },
      { projeto: "Agrofloresta Cacau", valor: 65000, data: "2024-03-01", status: "Em processamento" }
    ]
  },
  {
    id: "SPON-002",
    nome: "Tech Green Corp",
    tipo: "Pessoa Jurídica",
    contato: "esg@techgreen.com",
    nivel: "Platina",
    total_investido: 1200000,
    projetos_apoiados: 5,
    status: "Ativo",
    logo: "https://ui-avatars.com/api/?name=Tech+Green&background=0d47a1&color=fff",
    portfolio: [
       { projeto: "Manejo Madeira Certificada", valor: 1200000, data: "2023-11-20", status: "Confirmado" }
    ]
  }
];

// --- THEME ---
const theme = createTheme({
  palette: {
    primary: { main: '#1b5e20' }, 
    secondary: { main: '#4caf50' }, 
    background: { default: '#f4f6f8', paper: '#ffffff' },
    error: { main: '#d32f2f' },
    warning: { main: '#ed6c02' },
    success: { main: '#2e7d32' },
  },
  typography: {
    fontFamily: '"Roboto", sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none' } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 12 }, elevation1: { boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } } }
  }
});

// --- HELPER COMPONENTS ---
const MapEmbed = ({ lat, lng }) => {
  const offset = 0.05;
  const bbox = `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <Box sx={{ width: '100%', height: 300, bgcolor: '#eee', borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
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

// --- FIELD APP EMBEDDED ---
const FieldAppEmbedded = ({ onClose, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    descricao: "",
    proponente: "Técnico Administrativo", 
    estado: "Amazonas",
    municipio: "",
    tamanho: 0,
    unidade_medida: "ha",
    latitude: 0,
    longitude: 0,
    potencial: "Manejo de Madeira",
    data_submissao: new Date().toISOString().split('T')[0],
    custo_operacional: 0,
    ranking: 5,
    fotos: []
  });

  const steps = ['Identificação', 'Detalhes', 'Mídia', 'Revisão'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFormData(prev => ({...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude})),
        () => alert("Erro ao obter GPS")
      );
    }
  };

  const handleAddPhoto = () => {
    const randomId = Math.floor(Math.random() * 100);
    setFormData(prev => ({
        ...prev,
        fotos: [...prev.fotos, `https://picsum.photos/600?random=${randomId}`]
    }));
  };

  const handleFinish = () => {
    if (!formData.descricao || !formData.municipio) {
        alert("Preencha os campos obrigatórios");
        return;
    }
    const newProject = {
        ...formData,
        id: `PROJ-${Math.floor(Math.random() * 1000)}`,
        status: "Em Análise", 
        auditoria: { risco: "Baixo", alertas: [] } 
    };
    onSave(newProject);
  };

  const renderStep = (step) => {
    switch(step) {
      case 0:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
                <TextField fullWidth required label="Nome do Projeto / Comunidade" name="descricao" value={formData.descricao} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Estado" name="estado" value={formData.estado} onChange={handleChange}>
                    {CONSTANTS.ESTADOS.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Município" name="municipio" value={formData.municipio} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f1f8e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="subtitle2">Geolocalização</Typography>
                        <Typography variant="caption">Lat: {formData.latitude.toFixed(4)} / Long: {formData.longitude.toFixed(4)}</Typography>
                    </Box>
                    <Button size="small" variant="contained" onClick={handleGeoLocation} startIcon={<Map />}>Capturar GPS</Button>
                </Paper>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
             <Grid item xs={8}>
                <TextField fullWidth type="number" label="Tamanho da Área" name="tamanho" value={formData.tamanho} onChange={handleChange} />
            </Grid>
            <Grid item xs={4}>
                <TextField select fullWidth label="Unid." name="unidade_medida" value={formData.unidade_medida} onChange={handleChange}>
                    {CONSTANTS.UNIDADES.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12}>
                <TextField select fullWidth label="Potencial" name="potencial" value={formData.potencial} onChange={handleChange}>
                    {CONSTANTS.POTENCIAIS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12}>
                <TextField fullWidth type="number" label="Custo Operacional (R$)" name="custo_operacional" value={formData.custo_operacional} onChange={handleChange} />
            </Grid>
          </Grid>
        );
      case 2: 
        return (
           <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="outlined" component="label" startIcon={<CloudUpload />} onClick={handleAddPhoto}>
                Simular Upload de Foto
              </Button>
              <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                 {formData.fotos.map((f, i) => (
                    <Avatar key={i} src={f} variant="rounded" sx={{ width: 80, height: 80 }} />
                 ))}
                 {formData.fotos.length === 0 && <Typography variant="caption" color="textSecondary">Nenhuma foto adicionada</Typography>}
              </Box>
           </Box>
        );
      case 3:
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Resumo do Cadastro</Typography>
                <Typography variant="body2">Projeto: {formData.descricao}</Typography>
                <Typography variant="body2">Local: {formData.municipio} - {formData.estado}</Typography>
                <Typography variant="body2">Área: {formData.tamanho} {formData.unidade_medida}</Typography>
                <Typography variant="body2" fontWeight="bold">Valor: R$ {formData.custo_operacional}</Typography>
            </Alert>
        );
      default: return null;
    }
  };

  return (
    <Box>
       <Stepper activeStep={activeStep} alternativeLabel>
         {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
       </Stepper>
       
       <Box sx={{ minHeight: 300 }}>
          {renderStep(activeStep)}
       </Box>

       <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
          <Button disabled={activeStep === 0} onClick={() => setActiveStep(p => p - 1)} startIcon={<ArrowBack />}>Voltar</Button>
          {activeStep === steps.length - 1 ? (
             <Button variant="contained" color="primary" onClick={handleFinish} startIcon={<CheckCircle />}>Finalizar Cadastro</Button>
          ) : (
             <Button variant="contained" onClick={() => setActiveStep(p => p + 1)} endIcon={<ArrowForward />}>Próximo</Button>
          )}
       </Box>
    </Box>
  );
};

// --- SPONSORS VIEW ---
const SponsorsView = () => {
  const [selectedSponsor, setSelectedSponsor] = useState(null);

  const getNivelColor = (nivel) => {
    switch(nivel) {
      case 'Platina': return 'info';
      case 'Ouro': return 'warning';
      case 'Prata': return 'default';
      default: return 'default';
    }
  };

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
              <TableCell>Patrocinador</TableCell>
              <TableCell>Contato</TableCell>
              <TableCell>Nível / Tier</TableCell>
              <TableCell>Total Patrocinado</TableCell>
              <TableCell>Projetos</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Detalhes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_SPONSORS.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar src={row.logo} variant="rounded" />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">{row.nome}</Typography>
                      <Typography variant="caption" color="textSecondary">{row.tipo}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{row.contato}</TableCell>
                <TableCell>
                  <Chip label={row.nivel} color={getNivelColor(row.nivel)} size="small" icon={<EmojiEvents sx={{fontSize: 16}}/>} />
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold" color="success.main">
                    R$ {row.total_investido.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>{row.projetos_apoiados}</TableCell>
                <TableCell>
                   <Chip 
                      label={row.status} 
                      size="small" 
                      color={row.status === 'Ativo' ? 'success' : 'warning'} 
                      variant="outlined" 
                    />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => setSelectedSponsor(row)}>
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer
        anchor="right"
        open={Boolean(selectedSponsor)}
        onClose={() => setSelectedSponsor(null)}
        PaperProps={{ sx: { width: { xs: '100%', md: 500 } } }}
      >
        {selectedSponsor && (
          <Box display="flex" flexDirection="column" height="100%">
            <Box p={3} bgcolor="#f4f6f8" borderBottom="1px solid #e0e0e0">
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                 <Box display="flex" gap={2} alignItems="center">
                    <Avatar src={selectedSponsor.logo} sx={{ width: 64, height: 64 }} variant="rounded" />
                    <Box>
                       <Typography variant="h6">{selectedSponsor.nome}</Typography>
                       <Chip label={selectedSponsor.nivel} size="small" color={getNivelColor(selectedSponsor.nivel)} />
                       <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                          <Verified color="primary" sx={{ fontSize: 16 }} />
                          <Typography variant="caption" color="primary">KYC Verificado</Typography>
                       </Box>
                    </Box>
                 </Box>
                 <IconButton onClick={() => setSelectedSponsor(null)}><Close /></IconButton>
              </Box>
            </Box>

            <Box p={3} flexGrow={1} overflow="auto">
              <Stack spacing={3}>
                 <Paper variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                       <Grid item xs={12}>
                          <Box display="flex" gap={1} mb={1}>
                             <Business fontSize="small" color="action" />
                             <Typography variant="body2">{selectedSponsor.tipo}</Typography>
                          </Box>
                          <Box display="flex" gap={1} mb={1}>
                             <Email fontSize="small" color="action" />
                             <Typography variant="body2">{selectedSponsor.contato}</Typography>
                          </Box>
                          <Box display="flex" gap={1}>
                             <Phone fontSize="small" color="action" />
                             <Typography variant="body2">+55 (11) 99999-0000</Typography>
                          </Box>
                       </Grid>
                    </Grid>
                 </Paper>

                 <Box>
                    <Typography variant="subtitle2" gutterBottom>Volume Financeiro</Typography>
                    <Paper sx={{ p: 2, bgcolor: '#e8f5e9', color: '#1b5e20' }}>
                       <Typography variant="caption">Total Aportado em Projetos</Typography>
                       <Typography variant="h4" fontWeight="bold">R$ {selectedSponsor.total_investido.toLocaleString()}</Typography>
                    </Paper>
                 </Box>

                 <Box>
                    <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
                       <History fontSize="small" /> Histórico de Aportes
                    </Typography>
                    <List disablePadding sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                       {selectedSponsor.portfolio.map((item, index) => (
                          <React.Fragment key={index}>
                             <ListItem alignItems="flex-start">
                                <ListItemAvatar>
                                   <Avatar sx={{ bgcolor: 'primary.light' }}><AccountBalanceWallet /></Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                   primary={item.projeto}
                                   secondary={
                                     <React.Fragment>
                                       <Typography component="span" variant="body2" color="text.primary">
                                         R$ {item.valor.toLocaleString()}
                                       </Typography>
                                       {` — ${item.data}`}
                                     </React.Fragment>
                                   }
                                />
                                <Chip 
                                   label={item.status} 
                                   size="small" 
                                   color={item.status === 'Confirmado' ? 'success' : 'warning'} 
                                   variant="outlined" 
                                />
                             </ListItem>
                             {index < selectedSponsor.portfolio.length - 1 && <Divider component="li" />}
                          </React.Fragment>
                       ))}
                    </List>
                 </Box>
              </Stack>
            </Box>
            <Box p={2} borderTop="1px solid #e0e0e0">
               <Button fullWidth variant="contained" color="primary">Gerar Novo Contrato</Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

// --- MAIN APP ---
export default function AdminDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openCadastro, setOpenCadastro] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (project.descricao?.toLowerCase().includes(searchLower) || false) ||
        (project.municipio?.toLowerCase().includes(searchLower) || false) ||
        (project.proponente?.toLowerCase().includes(searchLower) || false);
      const matchesStatus = filterStatus === "Todos" ? true : project.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    return {
      area: projects.reduce((acc, p) => acc + (p.status === 'Aprovado' || p.status === 'Em Análise' ? Number(p.tamanho) : 0), 0),
      investimento: projects.reduce((acc, p) => acc + Number(p.custo_operacional), 0),
      pendentes: projects.filter(p => p.status === 'Em Análise').length,
      aprovados: projects.filter(p => p.status === 'Aprovado').length
    };
  }, [projects]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleStatusChange = (id, newStatus) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: newStatus,
          hash_blockchain: newStatus === 'Aprovado' ? `0x${Math.random().toString(16).substr(2, 40)}` : p.hash_blockchain
        };
      }
      return p;
    }));
    setSelectedProject(prev => ({ ...prev, status: newStatus }));
    if(newStatus === 'Aprovado' || newStatus === 'Rejeitado') setSelectedProject(null);
  };

  const handleSaveNewProject = (newProject) => {
      setProjects(prev => [newProject, ...prev]);
      setOpenCadastro(false);
      setCurrentView('projects'); 
  };

  const drawerContent = (
    <div>
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Landscape sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap>ARPT Admin</Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton selected={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')}>
            <ListItemIcon><Dashboard /></ListItemIcon>
            <ListItemText primary="Sala de Situação" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton selected={currentView === 'projects'} onClick={() => setCurrentView('projects')}>
            <ListItemIcon><FolderOpen /></ListItemIcon>
            <ListItemText primary="Gestão de Manejos" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton selected={currentView === 'sponsors'} onClick={() => setCurrentView('sponsors')}>
            <ListItemIcon><People /></ListItemIcon>
            <ListItemText primary="Patrocinadores" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ width: { sm: `calc(100% - 240px)` }, ml: { sm: '240px' }, bgcolor: 'white', color: 'text.primary', boxShadow: 1 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {currentView === 'dashboard' ? 'Visão Geral' : currentView === 'projects' ? 'Auditoria de Projetos' : 'Gestão de Patrocinadores'}
            </Typography>
            <IconButton><Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>A</Avatar></IconButton>
          </Toolbar>
        </AppBar>
        <Box component="nav" sx={{ width: { sm: 240 }, flexShrink: { sm: 0 } }}>
          <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 } }}>
            {drawerContent}
          </Drawer>
          <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 } }} open>
            {drawerContent}
          </Drawer>
        </Box>
        <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
          <Toolbar />
          {currentView === 'dashboard' && (
            <Box sx={{ animation: 'fadeIn 0.5s' }}>
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard title="Área Total" value={`${stats.area} ha`} subtext="Sob Gestão" color="#2e7d32" icon={<Landscape fontSize="large" />} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard title="Investimento" value={`R$ ${(stats.investimento/1000).toFixed(0)}k`} subtext="Pipeline Total" color="#0288d1" icon={<MonetizationOn fontSize="large" />} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard title="Pendências" value={stats.pendentes} subtext="Aguardando Análise" color="#ed6c02" icon={<Assignment fontSize="large" />} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard title="Ativos RWA" value={stats.aprovados} subtext="Tokenizados" color="#9c27b0" icon={<Verified fontSize="large" />} />
                </Grid>
              </Grid>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6">Pipeline de Aprovação</Typography>
                    <Box sx={{ my: 4 }}>
                      <Box sx={{ mb: 3 }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" fontWeight="bold">Em Análise Técnica</Typography>
                          <Typography variant="body2">{projects.filter(p=>p.status==='Em Análise').length} Projetos</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={50} color="warning" sx={{ height: 8, borderRadius: 5 }} />
                      </Box>
                      <Box sx={{ mb: 3 }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" fontWeight="bold">Aprovados / On-chain</Typography>
                          <Typography variant="body2">{projects.filter(p=>p.status==='Aprovado').length} Projetos</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={25} color="success" sx={{ height: 8, borderRadius: 5 }} />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                   <Paper sx={{ p: 3, height: '100%' }}>
                     <Typography variant="h6" gutterBottom>Riscos Recentes</Typography>
                     {projects.filter(p => p.auditoria.risco === 'Alto').length > 0 ? (
                        <List>
                            {projects.filter(p => p.auditoria.risco === 'Alto').map(p => (
                                <ListItem key={p.id} sx={{ bgcolor: '#ffebee', borderRadius: 2, mb: 1 }}>
                                    <ListItemIcon><Alert color="error" sx={{ fontSize: 20 }} /></ListItemIcon>
                                    <ListItemText primary={p.descricao} secondary="Risco Alto Detectado" />
                                </ListItem>
                            ))}
                        </List>
                     ) : (
                         <Box textAlign="center" py={4} color="text.secondary">
                             <Verified sx={{ fontSize: 40 }} />
                             <Typography>Tudo sob controle</Typography>
                         </Box>
                     )}
                   </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {currentView === 'projects' && (
            <Box sx={{ animation: 'fadeIn 0.5s' }}>
              <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
                <Toolbar sx={{ pl: 2, pr: 2, display: 'flex', gap: 2, flexWrap: 'wrap', py: 1, minHeight: 80 }}>
                  <Typography sx={{ flex: '1 1 100%', mb: 1, display: {xs: 'none', md: 'block'} }} variant="h6" component="div">
                    Esteira de Projetos ({filteredProjects.length})
                  </Typography>
                  <TextField
                    label="Buscar projeto, cidade..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{ startAdornment: <Search color="action" sx={{ mr: 1 }} /> }}
                    sx={{ flexGrow: 1, minWidth: 200 }}
                  />
                  <TextField
                    select
                    label="Status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    size="small"
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="Todos">Todos</MenuItem>
                    <MenuItem value="Em Análise">Em Análise</MenuItem>
                    <MenuItem value="Pendente Info">Pendente Info</MenuItem>
                    <MenuItem value="Aprovado">Aprovados</MenuItem>
                    <MenuItem value="Rejeitado">Rejeitados</MenuItem>
                  </TextField>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<Add />}
                    onClick={() => setOpenCadastro(true)}
                  >
                    Novo
                  </Button>
                </Toolbar>
                <TableContainer sx={{ maxHeight: '75vh' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Projeto / Proponente</TableCell>
                        <TableCell>Local</TableCell>
                        <TableCell>Investimento</TableCell>
                        <TableCell>Risco</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Ação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.id}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">{row.descricao}</Typography>
                              <Typography variant="caption" color="textSecondary">{row.proponente}</Typography>
                            </TableCell>
                            <TableCell>{row.municipio} - {row.estado}</TableCell>
                            <TableCell>
                              <Typography variant="body2">R$ {Number(row.custo_operacional).toLocaleString()}</Typography>
                            </TableCell>
                            <TableCell><RiskChip level={row.auditoria.risco} /></TableCell>
                            <TableCell><StatusChip status={row.status} /></TableCell>
                            <TableCell align="right">
                              <Button size="small" variant="contained" color="primary" startIcon={<Visibility />} onClick={() => setSelectedProject(row)}>
                                Auditar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                             <Typography color="textSecondary" variant="body1">
                                Nenhum projeto encontrado com estes filtros.
                             </Typography>
                             <Button sx={{ mt: 1 }} onClick={() => {setSearchTerm(""); setFilterStatus("Todos");}}>
                                Limpar Filtros
                             </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          )}

          {currentView === 'sponsors' && <SponsorsView />}

          <Drawer
            anchor="right"
            open={Boolean(selectedProject)}
            onClose={() => setSelectedProject(null)}
            PaperProps={{ sx: { width: { xs: '100%', md: 600 } } }}
          >
            {selectedProject && (
              <Box display="flex" flexDirection="column" height="100%">
                <Box p={3} bgcolor="primary.main" color="white">
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                     <Box>
                        <Typography variant="overline" sx={{ opacity: 0.8 }}>DUE DILIGENCE TÉCNICA</Typography>
                        <Typography variant="h5">{selectedProject.descricao}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>{selectedProject.proponente}</Typography>
                     </Box>
                     <IconButton onClick={() => setSelectedProject(null)} sx={{ color: 'white' }}><Close /></IconButton>
                  </Box>
                </Box>
                <Box p={3} flexGrow={1} overflow="auto">
                  <Stack spacing={3}>
                    {selectedProject.auditoria.risco !== 'Baixo' && (
                       <Alert severity={selectedProject.auditoria.risco === 'Alto' ? 'error' : 'warning'} variant="filled">
                          <Typography variant="subtitle2" fontWeight="bold">Risco de Auditoria: {selectedProject.auditoria.risco}</Typography>
                          <ul style={{ margin: '5px 0', paddingLeft: 20 }}>
                            {selectedProject.auditoria.alertas.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                       </Alert>
                    )}
                    <Paper variant="outlined" sx={{ p: 2 }}>
                       <Grid container spacing={2}>
                          <Grid item xs={4}>
                             <Typography variant="caption" color="textSecondary">Área Total</Typography>
                             <Typography variant="h6">{selectedProject.tamanho} {selectedProject.unidade_medida}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                             <Typography variant="caption" color="textSecondary">Ranking</Typography>
                             <Typography variant="h6">{selectedProject.ranking} / 10</Typography>
                          </Grid>
                          <Grid item xs={4}>
                             <Typography variant="caption" color="textSecondary">Submissão</Typography>
                             <Typography variant="h6">{new Date(selectedProject.data_submissao).toLocaleDateString()}</Typography>
                          </Grid>
                       </Grid>
                    </Paper>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Map color="action" />
                        <Typography variant="subtitle2">Auditoria Geográfica</Typography>
                      </Box>
                      <MapEmbed lat={selectedProject.latitude} lng={selectedProject.longitude} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Evidências</Typography>
                      <Box display="flex" gap={1} overflow="auto" pb={1}>
                        {selectedProject.fotos.map((src, i) => (
                           <Box key={i} component="img" src={src} sx={{ width: 120, height: 120, borderRadius: 2, objectFit: 'cover', border: '1px solid #ddd' }} />
                        ))}
                      </Box>
                    </Box>
                  </Stack>
                </Box>
                <Box p={2} borderTop="1px solid #e0e0e0" bgcolor="#f9fafb" display="flex" gap={2} justifyContent="flex-end">
                   {selectedProject.status === 'Em Análise' && (
                     <>
                       <Button variant="outlined" color="error" onClick={() => handleStatusChange(selectedProject.id, 'Rejeitado')}>Rejeitar</Button>
                       <Button variant="contained" color="success" onClick={() => handleStatusChange(selectedProject.id, 'Aprovado')}>Aprovar</Button>
                     </>
                   )}
                </Box>
              </Box>
            )}
          </Drawer>

          <Dialog 
            open={openCadastro} 
            onClose={() => setOpenCadastro(false)}
            fullWidth
            maxWidth="md"
          >
             <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Novo Cadastro de Manejo
                <IconButton onClick={() => setOpenCadastro(false)} sx={{ color: 'white' }}><Close /></IconButton>
             </DialogTitle>
             <DialogContent sx={{ mt: 2 }}>
                <FieldAppEmbedded onClose={() => setOpenCadastro(false)} onSave={handleSaveNewProject} />
             </DialogContent>
          </Dialog>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
