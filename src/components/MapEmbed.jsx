
import React from 'react';
import { Box, Typography } from '@mui/material';
import { Map } from '@mui/icons-material';

export default function MapEmbed({ lat, lng }) {
  const isError = lat > 5 || lat < -15 || lng > -40 || lng < -75;
  if (isError) return (
    <Box sx={{ height: 250, bgcolor: '#ffebee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #d32f2f', borderRadius: 2 }}>
      <Map color="error" sx={{ fontSize: 40, mb: 1 }} />
      <Typography color="error" fontWeight="bold">ALERTA GEOFENCE</Typography>
      <Typography variant="caption">Coord ({lat}, {lng}) fora da Amazônia.</Typography>
    </Box>
  );
  return (
    <Box sx={{ height: 250, bgcolor: '#eee', borderRadius: 2, overflow: 'hidden' }}>
      <iframe width="100%" height="100%" frameBorder="0" src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.05},${lat-0.05},${lng+0.05},${lat+0.05}&layer=mapnik&marker=${lat},${lng}`} />
    </Box>
  );
}
