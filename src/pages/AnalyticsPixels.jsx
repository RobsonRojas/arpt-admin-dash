import React from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, 
  Button, Chip, Divider, Link 
} from '@mui/material';
import { 
  Analytics, Facebook, OpenInNew 
} from '@mui/icons-material';

export const AnalyticsPixels = () => {
  const facebookPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || process.env.REACT_APP_FACEBOOK_PIXEL_ID || '';
  const gaId = process.env.NEXT_PUBLIC_GA_ID || process.env.REACT_APP_GA_ID || process.env.NEXT_PUBLIC_GTM_ID || process.env.REACT_APP_GTM_ID || '';

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Analytics color="primary" /> Analytics / Pixels
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Configurações de rastreamento e links para acesso às plataformas de analytics.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Facebook color="primary" /> Meta/Facebook Pixel
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Facebook Pixel ID
                </Typography>
                {facebookPixelId ? (
                  <Chip 
                    label={facebookPixelId} 
                    color="primary" 
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                  />
                ) : (
                  <Chip 
                    label="Não configurado" 
                    color="default" 
                    variant="outlined"
                  />
                )}
              </Box>

              <Button
                variant="contained"
                color="primary"
                startIcon={<OpenInNew />}
                component={Link}
                href="https://www.facebook.com/events_manager/"
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
              >
                Acessar Facebook Events Manager
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Analytics color="secondary" /> Google Analytics
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Google Analytics ID (GA/GTM)
                </Typography>
                {gaId ? (
                  <Chip 
                    label={gaId} 
                    color="secondary" 
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                  />
                ) : (
                  <Chip 
                    label="Não configurado" 
                    color="default" 
                    variant="outlined"
                  />
                )}
              </Box>

              <Button
                variant="contained"
                color="secondary"
                startIcon={<OpenInNew />}
                component={Link}
                href="https://analytics.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
              >
                Acessar Google Analytics
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
