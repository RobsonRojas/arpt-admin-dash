import React, { useState, useMemo, useEffect } from 'react';
import { 
  createTheme, ThemeProvider, CssBaseline, Box, Drawer, AppBar, Toolbar, List, 
  Typography, Divider, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Grid, Paper, Chip, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Avatar, Button, Alert, Stack, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Stepper, Step, StepLabel,
  TextField, MenuItem, Switch, FormControlLabel, Card, CardContent, CardActions,
  CircularProgress, Container, InputAdornment
} from '@mui/material';
import { 
  Dashboard, FolderOpen, People, Menu as MenuIcon, Visibility, Map, Verified, 
  Close, Landscape, MonetizationOn, Assignment, Search, Add, CloudUpload, 
  ArrowBack, ArrowForward, CheckCircle, AccountBalanceWallet, EmojiEvents, 
  History, Business, Email, Phone, Forest, Warning, Rule, WhatsApp, Lock, 
  Logout, HomeWork, Edit, Save
} from '@mui/icons-material';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// --- CONFIGURAÇÃO FIREBASE ---
// Substitua pelas suas chaves reais
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
import { AdminContext } from './providers/adminProviders.jsx';
import { useContext } from 'react';

let app, auth;
try { app = initializeApp(firebaseConfig); auth = getAuth(app); } catch (e) { console.log("Firebase mock init"); }

// --- DADOS ---
const CONSTANTS = {
  ESTADOS: ["Amazonas", "Pará", "Acre", "Rondônia", "Mato Grosso", "Amapá", "Roraima"],
  UNIDADES: ["ha", "m²"],
  SPECIES: { "Paxiúba": { ff: 0.9 }, "Açaí": { ff: 0.85 }, "Outros": { ff: 0.7 } }
};

const INITIAL_PROJECTS = [
  { id: "PROJ-01", status: "Em Análise", descricao: "Manejo Pirarucu", proponente: "Assoc. Solimões", municipio: "Tefé", tamanho: 1200, custo: 85000, risco: "Baixo", lat: -3.35, lng: -64.71 },
  { id: "PROJ-02", status: "Aprovado", descricao: "Agrofloresta Cacau", proponente: "Coop. Verde", municipio: "Altamira", tamanho: 450, custo: 120000, risco: "Baixo", lat: -3.20, lng: -52.20 }
];

const INITIAL_PROPS = [
  { id: "PROP-101", proprietario: "Maria Graças", car: "AM-1302401", municipio: "Tefé", area: 50, status: "Regular", lat: -3.35, lng: -64.71, foto: "" },
  { id: "PROP-102", proprietario: "José Ferreira", car: "AM-9988771", municipio: "Alvarães", area: 120, status: "Pendente", lat: -3.22, lng: -64.80, foto: "" }
];

const INITIAL_NECRO = [
  { id: "NECRO-59", solicitante: "João Silva", especie: "Paxiúba", volume: 0.557, status: "Pendente", lat: 58.0, lng: 25.0, alerts: ["Geofence Error"] }
];

const MOCK_SPONSORS = [
  { id: "SPON-01", nome: "EcoFurniture", nivel: "Ouro", total: 450000 },
  { id: "SPON-02", nome: "Tech Green", nivel: "Platina", total: 1200000 }
];

const THEME = createTheme({
  palette: { primary: { main: '#1b5e20' }, secondary: { main: '#4caf50' }, background: { default: '#f4f6f8' } },
  components: { MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none' } } }, MuiPaper: { styleOverrides: { rounded: { borderRadius: 12 } } }, MuiTextField: { defaultProps: { size: "small", variant: "outlined" } } }
});

// --- COMPONENTES ---
const MapEmbed = ({ lat, lng }) => {
  const isError = lat > 5 || lat < -15 || lng > -40 || lng < -75;
  if (isError) return <Box sx={{ height: 200, bgcolor: '#ffebee', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid red', borderRadius:2 }}><Typography color="error">ALERTA GEOFENCE</Typography></Box>;
  return <Box sx={{ height: 200, bgcolor: '#eee', borderRadius:2, overflow:'hidden' }}><iframe width="100%" height="100%" frameBorder="0" src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.05},${lat-0.05},${lng+0.05},${lat+0.05}&layer=mapnik&marker=${lat},${lng}`} /></Box>;
};

const StatCard = ({ title, value, icon, color }) => (
  <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Box><Typography variant="body2" color="textSecondary">{title}</Typography><Typography variant="h5" fontWeight="bold">{value}</Typography></Box>
    <Box sx={{ p: 1, borderRadius: '50%', bgcolor: `${color}20`, color: color }}>{icon}</Box>
  </Paper>
);

// --- VIEWS ---

const PropertiesView = () => {
  const [props, setProps] = useState(INITIAL_PROPS);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ id: '', proprietario: '', car: '', municipio: '', area: '', status: 'Regular', lat: '', lng: '' });
  const [selected, setSelected] = useState(null);

  const handleSave = () => {
    const newProp = { ...form, id: editing ? form.id : `PROP-${Date.now()}`, area: Number(form.area), coords: { lat: Number(form.lat), lng: Number(form.lng) } };
    setProps(editing ? props.map(p => p.id === newProp.id ? newProp : p) : [newProp, ...props]);
    setOpen(false);
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Box display="flex" justifyContent="space-between" mb={3}><Typography variant="h5"><HomeWork /> Propriedades</Typography><Button variant="contained" startIcon={<Add />} onClick={()=>{setForm({});setEditing(false);setOpen(true)}}>Cadastrar</Button></Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Proprietário/CAR</TableCell><TableCell>Município</TableCell><TableCell>Área</TableCell><TableCell>Status</TableCell><TableCell>Ações</TableCell></TableRow></TableHead><TableBody>
        {props.map(p => (
          <TableRow key={p.id}>
            <TableCell><b>{p.proprietario}</b><br/><small>{p.car}</small></TableCell><TableCell>{p.municipio}</TableCell><TableCell>{p.area} ha</TableCell>
            <TableCell><Chip label={p.status} color={p.status==='Regular'?'success':'warning'} size="small"/></TableCell>
            <TableCell><IconButton onClick={()=>setSelected(p)}><Visibility/></IconButton><IconButton onClick={()=>{setForm(p);setEditing(true);setOpen(true)}}><Edit/></IconButton></TableCell>
          </TableRow>
        ))}
      </TableBody></Table></TableContainer>
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth>
        <DialogTitle>{editing ? 'Editar' : 'Nova'} Propriedade</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth label="Proprietário" value={form.proprietario||''} onChange={e=>setForm({...form, proprietario:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="CAR" value={form.car||''} onChange={e=>setForm({...form, car:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="Município" value={form.municipio||''} onChange={e=>setForm({...form, municipio:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="Área (ha)" value={form.area||''} onChange={e=>setForm({...form, area:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="Status" value={form.status||''} onChange={e=>setForm({...form, status:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="Lat" value={form.lat||''} onChange={e=>setForm({...form, lat:e.target.value})}/></Grid>
            <Grid item xs={6}><TextField fullWidth label="Lng" value={form.lng||''} onChange={e=>setForm({...form, lng:e.target.value})}/></Grid>
            <Grid item xs={12}><Button variant="outlined" startIcon={<CloudUpload />}>Foto</Button></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={()=>setOpen(false)}>Cancelar</Button><Button variant="contained" onClick={handleSave}>Salvar</Button></DialogActions>
      </Dialog>
      <Drawer anchor="right" open={Boolean(selected)} onClose={()=>setSelected(null)}><Box p={3} width={350}><Typography variant="h6">Detalhes</Typography>{selected && <><Typography><b>{selected.proprietario}</b></Typography><MapEmbed lat={selected.lat || -3.0} lng={selected.lng || -60.0} /></>}</Box></Drawer>
    </Box>
  );
};

const NecromassaView = () => {
  const [reqs, setReqs] = useState(INITIAL_NECRO);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({solicitante:'', especie:'Paxiúba', cap:'', alt:'', lat:'', lng:'', foto:false});
  
  const handleSave = () => {
    const vol = (parseFloat(form.cap)/Math.PI)**2 * Math.PI / 40000 * parseFloat(form.alt) * 0.9;
    setReqs([{id:'NEW', ...form, volume: vol.toFixed(3), status:'Aprovado', alerts:[], lat: parseFloat(form.lat), lng: parseFloat(form.lng)}, ...reqs]);
    setOpen(false);
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Box display="flex" justifyContent="space-between" mb={3}><Typography variant="h5"><Forest/> Necromassa</Typography><Button variant="contained" startIcon={<WhatsApp/>} onClick={()=>setOpen(true)}>Input WhatsApp</Button></Box>
      <Grid container spacing={2}>{reqs.map((r,i)=>(<Grid item xs={12} md={6} key={i}><Card><CardContent><Typography variant="h6">{r.solicitante}</Typography><Typography>{r.especie} - {r.volume} m³</Typography>{r.alerts?.map(a=><Alert severity="error" key={a}>{a}</Alert>)}</CardContent></Card></Grid>))}</Grid>
      <Dialog open={open} onClose={()=>setOpen(false)}><DialogTitle>Input WhatsApp</DialogTitle><DialogContent><Box mt={1} display="flex" flexDirection="column" gap={2}><TextField label="Solicitante" onChange={e=>setForm({...form, solicitante:e.target.value})}/><TextField label="CAP" onChange={e=>setForm({...form, cap:e.target.value})}/><TextField label="Alt" onChange={e=>setForm({...form, alt:e.target.value})}/><TextField label="Lat" onChange={e=>setForm({...form, lat:e.target.value})}/><TextField label="Lng" onChange={e=>setForm({...form, lng:e.target.value})}/><FormControlLabel control={<Switch onChange={e=>setForm({...form, foto:e.target.checked})}/>} label="Foto Raiz?"/></Box></DialogContent><DialogActions><Button onClick={handleSave}>Salvar</Button></DialogActions></Dialog>
    </Box>
  );
};

const FieldAppEmbedded = ({ onClose, onSave, initialData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(initialData || { descricao: "", municipio: "Tefé", tamanho: "", custo: "", lat: 0, lng: 0 });
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
                  <Grid item xs={12}><TextField fullWidth label="Custo Operacional (R$)" type="number" value={formData.custo_operacional} onChange={e=>setFormData({...formData, custo_operacional: e.target.value})} /></Grid>
              </Grid>
          ) : (
              <Alert severity="info">Confirme: {formData.descricao}, {formData.municipio}, {formData.tamanho} ha.</Alert>
          )}
       </Box>
       <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button disabled={activeStep === 0} onClick={()=>setActiveStep(0)}>Voltar</Button>
          {activeStep === 0 ? <Button variant="contained" onClick={()=>setActiveStep(1)}>Próximo</Button> : <Button variant="contained" color="success" startIcon={<CheckCircle/>} onClick={() => onSave({...formData, id: formData.id || "NEW", status: "Em Análise", auditoria: {risco: "Baixo"}})}>Salvar</Button>}
       </Box>
    </Box>
  );
};

const ProjectsView = ({ projects, onSave, onEdit }) => {
    return (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
            <Box display="flex" justifyContent="space-between" mb={3}><Typography variant="h5">Projetos de Manejo</Typography><Button variant="contained" startIcon={<Add />} onClick={() => onEdit(null)}>Novo Manejo</Button></Box>
            <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Projeto</TableCell><TableCell>Status</TableCell><TableCell>Custo</TableCell><TableCell>Ações</TableCell></TableRow></TableHead><TableBody>
                {projects.map(p => (
                    <TableRow key={p.id}>
                        <TableCell>{p.descricao}</TableCell>
                        <TableCell><Chip label={p.id_status===5?'Em Captação': p.id_status=== 1 ? 'Em Digitação' : 'Em Análise'} color={p.id_status===5?'success':'warning'} size="small"/></TableCell>
                        <TableCell>R$ {p.custo_operacional}</TableCell>
                        <TableCell><IconButton onClick={() => onEdit(p)}><Edit/></IconButton><IconButton><Visibility/></IconButton></TableCell>
                    </TableRow>
                ))}
            </TableBody></Table></TableContainer>
        </Box>
    );
};

const Login = () => {
  const [email, setEmail] = useState(''); const [pass, setPass] = useState('');
  const handleLogin = (e) => { e.preventDefault(); signInWithEmailAndPassword(auth, email, pass).catch(e => alert(e.message)); };
  return (
    <Container maxWidth="xs" sx={{height:'100vh', display:'flex', alignItems:'center'}}><Paper sx={{p:4, width:'100%', textAlign:'center'}}><Typography variant="h5">Login ARPT</Typography><form onSubmit={handleLogin}><TextField fullWidth margin="normal" label="Email" onChange={e=>setEmail(e.target.value)}/><TextField fullWidth margin="normal" type="password" label="Senha" onChange={e=>setPass(e.target.value)}/><Button fullWidth variant="contained" type="submit" sx={{mt:2}}>Entrar</Button></form></Paper></Container>
  );
};

// --- APP ---
export default function App() {
  const { 
    projects
  } = useContext(AdminContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [drawer, setDrawer] = useState(false);
  
  // Projects State

  const [openProjectWizard, setOpenProjectWizard] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => { 
      if(auth) { const u = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); }); return u; } 
      else { setLoading(false); }
  }, []);

  const handleProjectSave = (p) => {
      if(p.id === "NEW") { setProjects([{...p, id: `PROJ-${Date.now()}`}, ...projects]); }
      else { setProjects(projects.map(proj => proj.id === p.id ? p : proj)); }
      setOpenProjectWizard(false);
  };

  const openWizard = (p) => { setEditingProject(p); setOpenProjectWizard(true); };

  if (loading) return <CircularProgress />;
  // if (!user && auth) return <ThemeProvider theme={THEME}><CssBaseline/><Login/></ThemeProvider>;

  return (
    <ThemeProvider theme={THEME}>
      <CssBaseline />
      <AppBar position="fixed" sx={{zIndex:1201}}><Toolbar><IconButton color="inherit" onClick={()=>setDrawer(!drawer)} sx={{mr:2}}><MenuIcon/></IconButton><Typography variant="h6" flexGrow={1}>ARPT Admin</Typography><IconButton color="inherit" onClick={()=>auth && signOut(auth)}><Logout/></IconButton></Toolbar></AppBar>
      <Box display="flex">
        <Drawer open={drawer} onClose={()=>setDrawer(false)} variant="temporary" sx={{'& .MuiDrawer-paper':{width:240, mt:8}}}><List>
          <ListItem disablePadding><ListItemButton onClick={()=>{setView('dashboard');setDrawer(false)}}><ListItemIcon><Dashboard/></ListItemIcon><ListItemText primary="Dashboard"/></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton onClick={()=>{setView('properties');setDrawer(false)}}><ListItemIcon><HomeWork/></ListItemIcon><ListItemText primary="Propriedades"/></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton onClick={()=>{setView('necromassa');setDrawer(false)}}><ListItemIcon><Forest/></ListItemIcon><ListItemText primary="Necromassa"/></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton onClick={()=>{setView('projects');setDrawer(false)}}><ListItemIcon><FolderOpen/></ListItemIcon><ListItemText primary="Projetos"/></ListItemButton></ListItem>
          <ListItem disablePadding><ListItemButton onClick={()=>{setView('sponsors');setDrawer(false)}}><ListItemIcon><People/></ListItemIcon><ListItemText primary="Patrocinadores"/></ListItemButton></ListItem>
        </List></Drawer>
        <Box component="main" sx={{flexGrow:1, p:3, mt:8, width:'100%'}}>
          {view === 'dashboard' && <Grid container spacing={2}><Grid item xs={6} md={3}><StatCard title="Área" value="1650 ha" color="#2e7d32" icon={<Landscape/>}/></Grid><Grid item xs={6} md={3}><StatCard title="Investimento" value="R$ 205k" color="#0288d1" icon={<MonetizationOn/>}/></Grid></Grid>}
          {view === 'properties' && <PropertiesView />}
          {view === 'necromassa' && <NecromassaView />}
          {view === 'projects' && <ProjectsView projects={projects} onEdit={openWizard} />}
          {view === 'sponsors' && <Box><Typography variant="h5">Patrocinadores</Typography><TableContainer component={Paper} sx={{mt:2}}><Table><TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Total</TableCell></TableRow></TableHead><TableBody>{MOCK_SPONSORS.map(s=><TableRow key={s.id}><TableCell>{s.nome}</TableCell><TableCell>R$ {s.total.toLocaleString()}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Box>}
        </Box>
      </Box>
      <Dialog open={openProjectWizard} onClose={()=>setOpenProjectWizard(false)} fullWidth maxWidth="md">
          <DialogTitle>{editingProject ? 'Editar Manejo' : 'Novo Manejo'}</DialogTitle>
          <DialogContent><FieldAppEmbedded onClose={()=>setOpenProjectWizard(false)} onSave={handleProjectSave} initialData={editingProject} /></DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}
