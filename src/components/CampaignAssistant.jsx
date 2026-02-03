import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, CircularProgress, Paper, Divider, IconButton } from '@mui/material';
import { AutoAwesome, ContentCopy, Refresh } from '@mui/icons-material';
import MDEditor from '@uiw/react-md-editor';
import { generateCampaignStrategy } from '../services/gemini';
import { useAdmin } from '../contexts/AdminContext';

export const CampaignAssistant = ({ project }) => {
    const { getRewardsByManejoId } = useAdmin();
    const [strategy, setStrategy] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rewards, setRewards] = useState([]);

    useEffect(() => {
        if (project?.id) {
            loadContextData();
        }
    }, [project]);

    const loadContextData = async () => {
        try {
            const data = await getRewardsByManejoId(project.id);
            if (data && Array.isArray(data)) {
                setRewards(data);
            }
        } catch (err) {
            console.error("Erro ao carregar recompensas para contexto:", err);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            // Passing rewards as both products and rewards since in this system they seem to be the same entity (Project Products/Rewards)
            // or we could differentiate if we had separate endpoints.
            const result = await generateCampaignStrategy(project, rewards, rewards);
            setStrategy(result);
        } catch (err) {
            console.error("Erro ao gerar estratégia:", err);
            setError("Não foi possível gerar a estratégia. Verifique sua conexão ou tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(strategy);
        alert("Estratégia copiada para a área de transferência!");
    };

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                    <AutoAwesome color="secondary" /> Estratégista de Campanha IA
                </Typography>
                {strategy && (
                    <Button
                        size="small"
                        startIcon={<Refresh />}
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        Regerar
                    </Button>
                )}
            </Box>

            {!strategy && !loading && (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    flexGrow={1}
                    p={4}
                    sx={{ bgcolor: 'background.default', borderRadius: 2, border: '1px dashed #ccc' }}
                >
                    <AutoAwesome sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="subtitle1" gutterBottom align="center">
                        Crie um plano de ação personalizado para sua campanha de financiamento.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" paragraph>
                        A IA analisará seu projeto, produtos e recompensas para sugerir a melhor narrativa, recompensas e calendário de marketing.
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AutoAwesome />}
                        onClick={handleGenerate}
                        sx={{ mt: 2 }}
                    >
                        Gerar Estratégia Agora
                    </Button>
                </Box>
            )}

            {loading && (
                <Box display="flex" flexDirection="column" alignItems="center" justifyItems="center" flexGrow={1} p={4}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Analisando dados do projeto e gerando estratégia...
                    </Typography>
                </Box>
            )}

            {error && (
                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                    <Typography>{error}</Typography>
                    <Button onClick={handleGenerate} sx={{ mt: 1, color: 'inherit', fontWeight: 'bold' }}>
                        Tentar Novamente
                    </Button>
                </Paper>
            )}

            {strategy && !loading && (
                <Paper sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0' }}>
                    <Box sx={{ p: 1, bgcolor: 'grey.100', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #e0e0e0' }}>
                        <IconButton onClick={handleCopy} size="small" title="Copiar texto">
                            <ContentCopy fontSize="small" />
                        </IconButton>
                    </Box>
                    <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }} data-color-mode="light">
                        <MDEditor.Markdown source={strategy} />
                    </Box>
                </Paper>
            )}
        </Box>
    );
};
