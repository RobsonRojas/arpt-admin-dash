import React, { useState, useMemo } from 'react';
import { ThemeProvider, CssBaseline, Box, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { theme } from './utils/theme';
import { INITIAL_PROJECTS } from './utils/constants';

// Layout
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';

// Modules
import DashboardView from './components/modules/DashboardView';
import NecromassaView from './components/modules/NecromassaView';
import ProjectsView from './components/modules/ProjectsView';
import SponsorsView from './components/modules/SponsorsView';
import FieldAppEmbedded from './components/modules/FieldAppEmbedded';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openCadastro, setOpenCadastro] = useState(false);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);

  const stats = useMemo(() => ({
      area: 1650, investimento: 205000, pendentes: 1, aprovados: 1
  }), []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  
  const handleStatusChange = (id, newStatus) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const handleSaveNewProject = (p) => { 
      setProjects([...projects, p]); 
      setOpenCadastro(false); 
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
        <CssBaseline />
        <TopBar handleDrawerToggle={handleDrawerToggle} currentView={currentView} />
        <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} currentView={currentView} setCurrentView={setCurrentView} />
        
        <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
          <ToolbarSpacer />
          
          {currentView === 'dashboard' && <DashboardView stats={stats} projects={projects} />}
          {currentView === 'necromassa' && <NecromassaView />}
          {currentView === 'projects' && <ProjectsView projects={projects} onStatusChange={handleStatusChange} onOpenCadastro={() => setOpenCadastro(true)} />}
          {currentView === 'sponsors' && <SponsorsView />}

          <Dialog open={openCadastro} onClose={() => setOpenCadastro(false)} fullWidth maxWidth="md">
             <DialogTitle>Novo Cadastro de Manejo</DialogTitle>
             <DialogContent><FieldAppEmbedded onClose={() => setOpenCadastro(false)} onSave={handleSaveNewProject} /></DialogContent>
          </Dialog>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

// Simple spacer component
const ToolbarSpacer = () => <div style={{ minHeight: 64 }} />;
