import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

export const StatCard = ({ title, value, subtext, icon, color }) => (
  <Paper 
    sx={{ 
      p: 3, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      height: '100%' 
    }}
  >
    <Box>
      <Typography 
        variant="body2" 
        color="textSecondary" 
        gutterBottom 
        fontWeight="bold"
      >
        {title.toUpperCase()}
      </Typography>
      <Typography variant="h4" fontWeight="bold" color="#333">
        {value}
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ 
          color: color, 
          bgcolor: `${color}15`, 
          px: 1, 
          py: 0.5, 
          borderRadius: 1, 
          mt: 1, 
          display: 'inline-block' 
        }}
      >
        {subtext}
      </Typography>
    </Box>
    <Box 
      sx={{ 
        p: 1.5, 
        borderRadius: '50%', 
        bgcolor: `${color}10`, 
        color: color 
      }}
    >
      {icon}
    </Box>
  </Paper>
);
