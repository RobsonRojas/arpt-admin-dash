import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, List, ListItem, ListItemText,
    ListItemSecondaryAction, Switch, IconButton, Button,
    Divider, CircularProgress, Alert, Snackbar, Card, CardContent
} from '@mui/material';
import {
    ArrowUpward, ArrowDownward, Save, SmartToy,
    SettingsSuggest, InfoOutlined
} from '@mui/icons-material';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { saveModelConfig } from '../services/gemini';

const ALL_POSSIBLE_MODELS = [
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Rápido e eficiente para a maioria das tarefas." },
    { id: "gemini-1.5-pro-latest", name: "Gemini 1.5 Pro", description: "Mais inteligente, ideal para textos complexos." },
    { id: "gemini-pro", name: "Gemini Pro (Legacy)", description: "Versão legada do modelo Pro." }
];

export const GeminiSettings = () => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'settings', 'gemini');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const savedModels = docSnap.data().models || [];
                // Merge with ALL_POSSIBLE_MODELS to ensure we have all available options
                const merged = ALL_POSSIBLE_MODELS.map(pModel => {
                    let saved = savedModels.find(s => s.id === pModel.id);

                    // Migration: Check for legacy ID for Pro model
                    if (!saved && pModel.id === 'gemini-1.5-pro-latest') {
                        saved = savedModels.find(s => s.id === 'gemini-1.5-pro');
                    }

                    // Use saved settings (enabled/priority) but ensure we use the NEW ID and Name from pModel
                    return saved ? { ...pModel, enabled: saved.enabled, priority: saved.priority } : { ...pModel, enabled: false, priority: 99 };
                }).sort((a, b) => a.priority - b.priority);

                setModels(merged);
            } else {
                // Use defaults with sorted priorities
                setModels(ALL_POSSIBLE_MODELS.map((m, idx) => ({ ...m, enabled: true, priority: idx + 1 })));
            }
        } catch (error) {
            console.error("Error loading settings:", error);
            setNotification({ open: true, message: "Erro ao carregar configurações.", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (id) => {
        setModels(prev => prev.map(m =>
            m.id === id ? { ...m, enabled: !m.enabled } : m
        ));
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const newModels = [...models];
        const item = newModels.splice(index, 1)[0];
        newModels.splice(index - 1, 0, item);
        // Resave priorities
        setModels(newModels.map((m, idx) => ({ ...m, priority: idx + 1 })));
    };

    const moveDown = (index) => {
        if (index === models.length - 1) return;
        const newModels = [...models];
        const item = newModels.splice(index, 1)[0];
        newModels.splice(index + 1, 0, item);
        setModels(newModels.map((m, idx) => ({ ...m, priority: idx + 1 })));
    };

    const handleSave = async () => {
        const enabledCount = models.filter(m => m.enabled).length;
        if (enabledCount === 0) {
            setNotification({ open: true, message: "Pelo menos um modelo deve estar ativado.", severity: "warning" });
            return;
        }

        setSaving(true);
        const success = await saveModelConfig(models);
        setSaving(false);

        if (success) {
            setNotification({ open: true, message: "Configurações salvas com sucesso!", severity: "success" });
        } else {
            setNotification({ open: true, message: "Erro ao salvar configurações.", severity: "error" });
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
                    <Typography variant="h5">Configuração dos Modelos IA</Typography>
                    <Typography variant="body2" color="textSecondary">
                        Gerencie quais modelos do Google Gemini são usados e defina a ordem de prioridade para fallback.
                    </Typography>
                </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }} icon={<InfoOutlined />}>
                O sistema tentará usar o primeiro modelo ativado da lista. Se a cota expirar, ele passará automaticamente para o próximo.
            </Alert>

            <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                <List sx={{ p: 0 }}>
                    {models.map((model, index) => (
                        <React.Fragment key={model.id}>
                            <ListItem sx={{ py: 2, bgcolor: model.enabled ? 'inherit' : 'action.hover' }}>
                                <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
                                    <IconButton size="small" onClick={() => moveUp(index)} disabled={index === 0}>
                                        <ArrowUpward fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => moveDown(index)} disabled={index === models.length - 1}>
                                        <ArrowDownward fontSize="small" />
                                    </IconButton>
                                </Box>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <SmartToy color={model.enabled ? "primary" : "disabled"} />
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, opacity: model.enabled ? 1 : 0.6 }}>
                                                {model.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', px: 1, borderRadius: 1 }}>
                                                P{model.priority}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={model.description}
                                />
                                <ListItemSecondaryAction>
                                    <Switch
                                        edge="end"
                                        onChange={() => handleToggle(model.id)}
                                        checked={model.enabled}
                                        color="primary"
                                    />
                                </ListItemSecondaryAction>
                            </ListItem>
                            {index < models.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
                <Box sx={{ p: 3, bgcolor: '#f9fafb', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                        onClick={handleSave}
                        disabled={saving}
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
