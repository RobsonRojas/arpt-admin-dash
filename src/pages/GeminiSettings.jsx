import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Switch, Button,
    CircularProgress, Alert, Snackbar, Card, CardContent,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    Save, SmartToy, SettingsSuggest, InfoOutlined
} from '@mui/icons-material';
import { getAiStatus, setAiStatus } from '../services/gemini';

export const GeminiSettings = () => {
    const [availableModels, setAvailableModels] = useState([]);
    const [defaultModel, setDefaultModel] = useState('');
    const [aiEnabled, setAiEnabledState] = useState(true);
    const [loading, setLoading] = useState(true);
    const [togglingAi, setTogglingAi] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const statusRes = await getAiStatus();
            if (statusRes) {
                if (typeof statusRes.enabled === 'boolean') {
                    setAiEnabledState(statusRes.enabled);
                }
                if (statusRes.defaultModel) {
                    setDefaultModel(statusRes.defaultModel);
                }
                if (statusRes.availableModels) {
                    setAvailableModels(statusRes.availableModels);
                }
            }
        } catch (error) {
            console.error("Error loading settings:", error);
            setNotification({ open: true, message: "Erro ao carregar configurações.", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleGlobalAiToggle = async () => {
        const nextState = !aiEnabled;
        setTogglingAi(true);
        try {
            await setAiStatus(nextState);
            setAiEnabledState(nextState);
            setNotification({
                open: true,
                message: `Serviço arpt-ai ${nextState ? 'HABILITADO' : 'DESABILITADO'} com sucesso!`,
                severity: nextState ? "success" : "warning"
            });
        } catch (error) {
            console.error("Error toggling global AI status:", error);
            setNotification({
                open: true,
                message: "Falha ao alterar o status do serviço arpt-ai.",
                severity: "error"
            });
        } finally {
            setTogglingAi(false);
        }
    };

    const handleModelChange = (event) => {
        setDefaultModel(event.target.value);
    };

    const handleSave = async () => {
        if (!defaultModel) {
            setNotification({ open: true, message: "Selecione um modelo padrão.", severity: "warning" });
            return;
        }

        setSaving(true);
        try {
            await setAiStatus(aiEnabled, defaultModel);
            setNotification({ open: true, message: "Modelo padrão salvo com sucesso!", severity: "success" });
        } catch (error) {
            console.error("Error saving default model:", error);
            setNotification({ open: true, message: "Erro ao salvar modelo.", severity: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, animation: 'fadeIn 0.5s' }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <SettingsSuggest color="primary" fontSize="large" />
                <Box>
                    <Typography variant="h5">Configuração dos Modelos IA e Microsserviço arpt-ai</Typography>
                    <Typography variant="body2" color="textSecondary">
                        Gerencie a disponibilidade geral da Inteligência Artificial e o modelo padrão.
                    </Typography>
                </Box>
            </Box>

            <Card elevation={0} sx={{ mb: 3, border: '1px solid #e0e0e0', bgcolor: aiEnabled ? '#f4fbf7' : '#fff5f5' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <SmartToy color={aiEnabled ? "success" : "disabled"} fontSize="large" />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                Status Global do Serviço arpt-ai
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {aiEnabled
                                    ? "O microsserviço de IA está HABILITADO e processando requisições."
                                    : "O microsserviço de IA está DESABILITADO pelo administrador (retornando 503)."
                                }
                            </Typography>
                        </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        {togglingAi && <CircularProgress size={24} />}
                        <Switch
                            checked={aiEnabled}
                            onChange={handleGlobalAiToggle}
                            disabled={togglingAi}
                            color="success"
                        />
                    </Box>
                </CardContent>
            </Card>

            <Alert severity="info" sx={{ mb: 3 }} icon={<InfoOutlined />}>
                O sistema tentará usar o modelo padrão. Se o modelo falhar (alta demanda), ele passará automaticamente para os próximos modelos disponíveis na lista de fallback do microsserviço.
            </Alert>

            <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Modelo de Inteligência Artificial Padrão
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>
                    Selecione o modelo do Gemini que será priorizado em todas as chamadas de IA.
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="default-model-label">Modelo Padrão</InputLabel>
                    <Select
                        labelId="default-model-label"
                        id="default-model-select"
                        value={defaultModel}
                        label="Modelo Padrão"
                        onChange={handleModelChange}
                        disabled={!aiEnabled || availableModels.length === 0}
                    >
                        {availableModels.map((modelId) => (
                            <MenuItem key={modelId} value={modelId}>
                                {modelId}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                        onClick={handleSave}
                        disabled={saving || !aiEnabled}
                    >
                        Salvar Configurações
                    </Button>
                </Box>
            </Paper>

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
