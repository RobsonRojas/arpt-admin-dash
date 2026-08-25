import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, 
    Alert, Snackbar, Card, CardContent, Divider,
    IconButton, InputAdornment
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Refresh,
    Dns,
    Save
} from '@mui/icons-material';

export const DeveloperSettings = () => {
    const [apiUrl, setApiUrl] = useState('');
    const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

    useEffect(() => {
        const savedUrl = localStorage.getItem('arpt_api_url');
        setApiUrl(savedUrl || 'https://arpt.site/api');
    }, []);

    const handleSave = () => {
        try {
            // Basic validation
            new URL(apiUrl);
            localStorage.setItem('arpt_api_url', apiUrl);
            setNotification({ 
                open: true, 
                message: "Configuração salva! Recarregue a página para aplicar.", 
                severity: "success" 
            });
        } catch (e) {
            setNotification({ 
                open: true, 
                message: "URL inválida.", 
                severity: "error" 
            });
        }
    };

    const handleReset = () => {
        const defaultUrl = 'https://arpt.site/api';
        setApiUrl(defaultUrl);
        localStorage.setItem('arpt_api_url', defaultUrl);
        setNotification({ 
            open: true, 
            message: "Configuração restaurada! Recarregue a página para aplicar.", 
            severity: "info" 
        });
    };

    const handleLocalhost = () => {
        const localUrl = 'http://localhost:3333';
        setApiUrl(localUrl);
        localStorage.setItem('arpt_api_url', localUrl);
        setNotification({ 
            open: true, 
            message: "Configuração alterada para Localhost! Recarregue a página para aplicar.", 
            severity: "info" 
        });
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <SettingsIcon color="primary" fontSize="large" />
                <Box>
                    <Typography variant="h5">Configurações de Desenvolvedor</Typography>
                    <Typography variant="body2" color="textSecondary">
                        Ajustes avançados para testes e desenvolvimento local.
                    </Typography>
                </Box>
            </Box>

            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                        <Dns fontSize="small" /> Endpoint da API
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Altere a URL base da API para apontar para seu ambiente local ou outro servidor de testes.
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <TextField
                            fullWidth
                            label="API Base URL"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="https://arpt.site/api"
                            variant="outlined"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => window.location.reload()} title="Recarregar página">
                                            <Refresh />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button 
                            variant="contained" 
                            startIcon={<Save />}
                            onClick={handleSave}
                        >
                            Salvar Alteração
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={handleLocalhost}
                        >
                            Usar Localhost (3333)
                        </Button>
                        <Button 
                            variant="text" 
                            color="inherit"
                            onClick={handleReset}
                        >
                            Restaurar Padrão
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Alert severity="warning">
                Alterar estas configurações pode quebrar o funcionamento do painel se a URL estiver incorreta ou o servidor estiver inacessível.
                As alterações são salvas apenas no seu navegador atual (localStorage).
            </Alert>

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={notification.severity} variant="filled" onClose={() => setNotification({ ...notification, open: false })}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
