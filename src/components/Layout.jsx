import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider,
  ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar, Tooltip,
  Snackbar, Alert
} from '@mui/material';
import {
  Dashboard, FolderOpen, People, Menu as MenuIcon,
  Landscape, Forest, HomeWork, Logout, ManageAccounts, CardGiftcard, CardMembership, History,
  SettingsSuggest,
  Payment,
  PermMedia
} from '@mui/icons-material';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';
import { setQuotaCallback } from '../services/gemini';

const DRAWER_WIDTH = 240;

export const Layout = ({ children }) => {
  const { currentView, mobileOpen, handleDrawerToggle, navigateTo } = useAdmin();
  const { signOut } = useAuth();

  // Quota Notification State
  const [quotaMeta, setQuotaMeta] = useState({ open: false, model: "" });

  useEffect(() => {
    // Register global callback for Gemini quota issues
    setQuotaCallback((modelName) => {
      setQuotaMeta({ open: true, model: modelName });
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Sala de Situação', icon: <Dashboard /> },
    { id: 'necromassa', label: 'Necromassa', icon: <Forest /> },
    { id: 'projects', label: 'Gestão Projetos', icon: <FolderOpen /> },
    { id: 'rewards', label: 'Recompensas', icon: <CardGiftcard /> },
    { id: 'products', label: 'Produtos', icon: <CardGiftcard /> },
    { id: 'certificates', label: 'Certificados', icon: <CardMembership /> },
    { id: 'properties', label: 'Propriedades', icon: <HomeWork /> },
    { id: 'sponsors', label: 'Patrocinadores', icon: <People /> },
    { id: 'users', label: 'Gestão de Usuários', icon: <ManageAccounts /> },
    { id: 'audit', label: 'Log de Modificações', icon: <History /> },
    { id: 'payment-config', label: 'Configurações de Pagamento', icon: <Payment /> }, // Using CardMembership as placeholder or we can import new icon
    { id: 'media-manager', label: 'Gerenciador de Arquivos', icon: <PermMedia /> },
    { id: 'gemini-settings', label: 'Configuração IA', icon: <SettingsSuggest /> },
  ];

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Visão Geral';
      case 'necromassa': return 'Gestão de Necromassa';
      case 'sponsors': return 'Patrocinadores';
      case 'properties': return 'Gestão de Propriedades';
      case 'projects': return 'Gestão de Projetos';
      case 'rewards': return 'Gerenciamento de Recompensas';
      case 'products': return 'Gestão de Produtos';
      case 'users': return 'Gestão de Usuários';
      case 'certificates': return 'Certificados Avulsos';
      case 'payment-config': return 'Configurações de Pagamento';
      case 'audit': return 'Log de Modificações';
      case 'media-manager': return 'Gerenciador de Arquivos';
      case 'gemini-settings': return 'Configuração IA';
      default: return 'ARPT Admin';
    }
  };

  const drawerContent = (
    <div>
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Landscape sx={{ mr: 2 }} />
        <Typography variant="h6" noWrap>ARPT Admin</Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentView === item.id}
              onClick={() => navigateTo(item.id)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getPageTitle()}
          </Typography>
          <Tooltip title="Sair">
            <IconButton onClick={handleLogout} color="inherit" sx={{ mr: 1 }}>
              <Logout />
            </IconButton>
          </Tooltip>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>A</Avatar>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH
            }
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH
            }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Global Notifications */}
      <Snackbar
        open={quotaMeta.open}
        autoHideDuration={6000}
        onClose={() => setQuotaMeta({ ...quotaMeta, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="warning" variant="filled" onClose={() => setQuotaMeta({ ...quotaMeta, open: false })} sx={{ width: '100%' }}>
          Cota expirada para o modelo {quotaMeta.model}. Alternando para modelo de backup...
        </Alert>
      </Snackbar>
    </Box>
  );
};

