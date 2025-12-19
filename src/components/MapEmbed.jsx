import React from 'react';
import { Box, Typography } from '@mui/material';
import { Map } from '@mui/icons-material';

export const MapEmbed = ({ lat, lng }) => {
  const isError = lat > 5 || lat < -15 || lng > -40 || lng < -75;
  
  if (isError) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: 250, 
          bgcolor: '#ffebee', 
          borderRadius: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          border: '1px solid #d32f2f' 
        }}
      >
        <Map color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h6" color="error">ALERTA DE GEOFENCE</Typography>
        <Typography variant="body2">
          Coordenadas ({lat}, {lng}) fora da Amazônia.
        </Typography>
      </Box>
    );
  }

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.05},${lat-0.05},${lng+0.05},${lat+0.05}&layer=mapnik&marker=${lat},${lng}`;
  
  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: 250, 
        bgcolor: '#eee', 
        borderRadius: 2, 
        overflow: 'hidden', 
        border: '1px solid #ddd' 
      }}
    >
      <iframe 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        scrolling="no" 
        marginHeight="0" 
        marginWidth="0" 
        src={src} 
        title="map"
      />
    </Box>
  );
};
