import React from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider,
  ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar, Tooltip
} from '@mui/material';
import {
  Dashboard, FolderOpen, People, Menu as MenuIcon,
  Landscape, Forest, HomeWork, Logout, ManageAccounts
} from '@mui/icons-material';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 240;

export const Layout = ({ children }) => {
  const { currentView, mobileOpen, handleDrawerToggle, navigateTo } = useAdmin();
  const { signOut } = useAuth();

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
    { id: 'properties', label: 'Propriedades', icon: <HomeWork /> },
    { id: 'sponsors', label: 'Patrocinadores', icon: <People /> },
    { id: 'users', label: 'Gestão de Usuários', icon: <ManageAccounts /> },
  ];

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Visão Geral';
      case 'necromassa': return 'Gestão de Necromassa';
      case 'sponsors': return 'Patrocinadores';
      case 'properties': return 'Gestão de Propriedades';
      case 'projects': return 'Gestão de Projetos';
      case 'users': return 'Gestão de Usuários';
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
    </Box>
  );
};
