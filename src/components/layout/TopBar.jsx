import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Avatar } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

const TopBar = ({ handleDrawerToggle, currentView }) => (
    <AppBar position="fixed" sx={{ width: { sm: `calc(100% - 240px)` }, ml: { sm: '240px' }, bgcolor: 'white', color: 'text.primary', boxShadow: 1 }}>
        <Toolbar>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}><MenuIcon /></IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                {currentView === 'dashboard' ? 'Visão Geral' : currentView === 'necromassa' ? 'Gestão de Necromassa' : currentView === 'sponsors' ? 'Patrocinadores' : 'Gestão de Projetos'}
            </Typography>
            <IconButton><Avatar sx={{ bgcolor: 'secondary.main' }}>A</Avatar></IconButton>
        </Toolbar>
    </AppBar>
);
export default TopBar;
