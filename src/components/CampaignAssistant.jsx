import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, CircularProgress, Paper, Divider, IconButton, Tabs, Tab } from '@mui/material';
import { AutoAwesome, ContentCopy, Refresh, Campaign, Business } from '@mui/icons-material';
import MDEditor from '@uiw/react-md-editor';
import { generateCampaignStrategy, generateBusinessModel } from '../services/gemini';
import { useAdmin } from '../contexts/AdminContext';

export const CampaignAssistant = ({ project }) => {
    const { getRewardsByManejoId } = useAdmin();
    const [strategy, setStrategy] = useState("");
    const [businessModel, setBusinessModel] = useState("");
    const [activeTab, setActiveTab] = useState(0); // 0 = Campaign, 1 = Business Model
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
            if (activeTab === 0) {
                const result = await generateCampaignStrategy(project, rewards, rewards);
                setStrategy(result);
            } else {
                const result = await generateBusinessModel(project);
                setBusinessModel(result);
            }
        } catch (err) {
            console.error("Erro ao gerar conteúdo:", err);
            setError("Não foi possível gerar a análise. Verifique sua conexão ou tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        const text = activeTab === 0 ? strategy : businessModel;
        navigator.clipboard.writeText(text);
        alert("Texto copiado para a área de transferência!");
    };

    const content = activeTab === 0 ? strategy : businessModel;

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                    <AutoAwesome color="secondary" /> Assistente de Estratégia IA
                </Typography>
                {content && (
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

            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="fullWidth"
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab icon={<Campaign />} label="Campanha" iconPosition="start" />
                <Tab icon={<Business />} label="Modelo de Negócio" iconPosition="start" />
            </Tabs>

            {!content && !loading && (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    flexGrow={1}
                    p={4}
                    sx={{ bgcolor: 'background.default', borderRadius: 2, border: '1px dashed #ccc' }}
                >
                    {activeTab === 0 ? (
                        <>
                            <Campaign sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="subtitle1" gutterBottom align="center">
                                Crie um plano de ação para sua campanha de financiamento.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="center" paragraph>
                                A IA analisará seu projeto e recompensas para sugerir narrativa e calendário.
                            </Typography>
                        </>
                    ) : (
                        <>
                            <Business sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="subtitle1" gutterBottom align="center">
                                Estruture o Modelo de Negócio do seu Projeto.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="center" paragraph>
                                A IA criará um Business Model Canvas adaptado para bioeconomia e impacto.
                            </Typography>
                        </>
                    )}

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AutoAwesome />}
                        onClick={handleGenerate}
                        sx={{ mt: 2 }}
                    >
                        Gerar Análise
                    </Button>
                </Box>
            )}

            {loading && (
                <Box display="flex" flexDirection="column" alignItems="center" justifyItems="center" flexGrow={1} p={4}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        {activeTab === 0 ? "Criando estratégia de campanha..." : "Estruturando modelo de negócio..."}
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

            {content && !loading && (
                <Paper sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0' }}>
                    <Box sx={{ p: 1, bgcolor: 'grey.100', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #e0e0e0' }}>
                        <IconButton onClick={handleCopy} size="small" title="Copiar texto">
                            <ContentCopy fontSize="small" />
                        </IconButton>
                    </Box>
                    <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }} data-color-mode="light">
                        <MDEditor.Markdown source={content} />
                    </Box>
                </Paper>
            )}
        </Box>
    );
};
