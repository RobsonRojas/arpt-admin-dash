
import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CircularProgress } from '@mui/material';
import { Menu, Dashboard, Forest, Folder, People, Logout } from '@mui/icons-material';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { theme } from './utils/theme';
import Login from './Login';
import DashboardView from './modules/DashboardView';
import NecromassaView from './modules/NecromassaView';
import ProjectsView from './modules/ProjectsView';
import SponsorsView from './modules/SponsorsView';

// CONFIGURAÇÃO FIREBASE - SUBSTITUA AQUI

  const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Init Firebase Safe
let auth;
try { 
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch(e) { console.log("Firebase init error", e); }

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [drawer, setDrawer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(auth) {
        const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
        return () => unsub();
    } else { setLoading(false); }
  }, []);

  if(loading) return <CircularProgress />;
  if(!user && auth) return <ThemeProvider theme={theme}><CssBaseline /><Login /></ThemeProvider>;
  // Fallback demo mode if auth fails to init
  if(!auth) console.warn("Running in No-Auth Demo Mode");

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <DashboardView />;
      case 'necromassa': return <NecromassaView />;
      case 'projects': return <ProjectsView />;
      case 'sponsors': return <SponsorsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <IconButton color="inherit" onClick={()=>setDrawer(!drawer)} sx={{ mr: 2 }}><Menu /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>ARPT Admin</Typography>
          {auth && <IconButton color="inherit" onClick={()=>signOut(auth)}><Logout /></IconButton>}
        </Toolbar>
      </AppBar>
      <Box display="flex">
        <Drawer open={drawer} onClose={()=>setDrawer(false)} sx={{ width: 240, flexShrink: 0, '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box', mt: 8 } }} variant="temporary">
          <List>
            <ListItem disablePadding><ListItemButton onClick={()=>{setView('dashboard');setDrawer(false)}}><ListItemIcon><Dashboard/></ListItemIcon><ListItemText primary="Dashboard"/></ListItemButton></ListItem>
            <ListItem disablePadding><ListItemButton onClick={()=>{setView('necromassa');setDrawer(false)}}><ListItemIcon><Forest/></ListItemIcon><ListItemText primary="Necromassa"/></ListItemButton></ListItem>
            <ListItem disablePadding><ListItemButton onClick={()=>{setView('projects');setDrawer(false)}}><ListItemIcon><Folder/></ListItemIcon><ListItemText primary="Projetos"/></ListItemButton></ListItem>
            <ListItem disablePadding><ListItemButton onClick={()=>{setView('sponsors');setDrawer(false)}}><ListItemIcon><People/></ListItemIcon><ListItemText primary="Patrocinadores"/></ListItemButton></ListItem>
          </List>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, width: '100%' }}>
          {renderView()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
