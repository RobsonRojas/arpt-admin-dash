import React from 'react';
import { Drawer, Toolbar, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import { Dashboard, Forest, FolderOpen, People, Landscape, CardGiftcard, CardMembership } from '@mui/icons-material';

const Sidebar = ({ mobileOpen, handleDrawerToggle, currentView, setCurrentView }) => {
    const content = (
        <div>
            <Toolbar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <Landscape sx={{ mr: 2 }} />
                <Typography variant="h6" noWrap>ARPT Admin</Typography>
            </Toolbar>
            <Divider />
            <List>
                <ListItem disablePadding><ListItemButton selected={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); if (mobileOpen) handleDrawerToggle(); }}><ListItemIcon><Dashboard /></ListItemIcon><ListItemText primary="Sala de Situação" /></ListItemButton></ListItem>
                <ListItem disablePadding><ListItemButton selected={currentView === 'necromassa'} onClick={() => { setCurrentView('necromassa'); if (mobileOpen) handleDrawerToggle(); }}><ListItemIcon><Forest /></ListItemIcon><ListItemText primary="Necromassa (Árvores)" /></ListItemButton></ListItem>
                <ListItem disablePadding><ListItemButton selected={currentView === 'projects'} onClick={() => { setCurrentView('projects'); if (mobileOpen) handleDrawerToggle(); }}><ListItemIcon><FolderOpen /></ListItemIcon><ListItemText primary="Projetos Manejo" /></ListItemButton></ListItem>
                <ListItem disablePadding><ListItemButton selected={currentView === 'rewards'} onClick={() => { setCurrentView('rewards'); if (mobileOpen) handleDrawerToggle(); }}><ListItemIcon><CardGiftcard /></ListItemIcon><ListItemText primary="Recompensas" /></ListItemButton></ListItem>
                <ListItem disablePadding><ListItemButton selected={currentView === 'products'} onClick={() => { setCurrentView('products'); if (mobileOpen) handleDrawerToggle(); }}><ListItemIcon><CardGiftcard /></ListItemIcon><ListItemText primary="Produtos" /></ListItemButton></ListItem>
                <ListItem disablePadding><ListItemButton selected={currentView === 'certificates'} onClick={() => { setCurrentView('certificates'); if (mobileOpen) handleDrawerToggle(); }}><ListItemIcon><CardMembership /></ListItemIcon><ListItemText primary="Certificados" /></ListItemButton></ListItem>
                <ListItem disablePadding><ListItemButton selected={currentView === 'sponsors'} onClick={() => { setCurrentView('sponsors'); if (mobileOpen) handleDrawerToggle(); }}><ListItemIcon><People /></ListItemIcon><ListItemText primary="Patrocinadores" /></ListItemButton></ListItem>
            </List>
        </div>
    );

    return (
        <Box component="nav" sx={{ width: { sm: 240 }, flexShrink: { sm: 0 } }}>
            <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 } }}>{content}</Drawer>
            <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 } }} open>{content}</Drawer>
        </Box>
    );
};
export default Sidebar;
