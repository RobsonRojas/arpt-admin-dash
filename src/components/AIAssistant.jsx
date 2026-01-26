import React, { useState } from 'react';
import {
    Box, Button, Menu, MenuItem, IconButton, Tooltip,
    CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, Typography, TextField
} from '@mui/material';
import { AutoFixHigh, MoreVert, Check, Close, ContentCopy } from '@mui/icons-material';
import { improveText } from '../services/gemini';

export const AIAssistant = ({ initialText, onApply, context = "", label = "Assistente IA" }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [openPreview, setOpenPreview] = useState(false);
    const [resultText, setResultText] = useState("");
    const [lastAction, setLastAction] = useState("");

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleAction = async (type) => {
        handleMenuClose();
        if (!initialText || initialText.length < 5) {
            alert("Insira um texto um pouco maior para a IA trabalhar.");
            return;
        }

        setLoading(true);
        setLastAction(type);
        try {
            const result = await improveText(initialText, context, type);
            setResultText(result);
            setOpenPreview(true);
        } catch (error) {
            console.error(error);
            alert("Erro ao processar solicitação. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        onApply(resultText);
        setOpenPreview(false);
    };

    return (
        <>
            <Box display="inline-block">
                {loading ? (
                    <CircularProgress size={24} sx={{ ml: 1 }} />
                ) : (
                    <Tooltip title="Assistente de Escrita IA">
                        <Button
                            color="primary"
                            size="small"
                            startIcon={<AutoFixHigh />}
                            onClick={handleMenuClick}
                            sx={{ textTransform: 'none' }}
                        >
                            {label}
                        </Button>
                    </Tooltip>
                )}

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => handleAction('improve')}>✨ Melhorar Escrita (Profissional)</MenuItem>
                    <MenuItem onClick={() => handleAction('fix')}>abc Corrigir Gramática</MenuItem>
                    <MenuItem onClick={() => handleAction('expand')}>➕ Expandir Texto</MenuItem>
                    <MenuItem onClick={() => handleAction('summarize')}>➖ Resumir</MenuItem>
                </Menu>
            </Box>

            <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoFixHigh color="primary" /> Suggestâo da IA
                </DialogTitle>
                <DialogContent dividers>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Box>
                            <Typography variant="caption" color="textSecondary">Texto Original:</Typography>
                            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                                <Typography variant="body2">{initialText}</Typography>
                            </Paper>
                        </Box>

                        <Box>
                            <Typography variant="caption" color="textSecondary" fontWeight="bold">Sugestão ({lastAction}):</Typography>
                            <TextField
                                fullWidth
                                multiline
                                minRows={4}
                                maxRows={10}
                                value={resultText}
                                onChange={(e) => setResultText(e.target.value)}
                                sx={{ mt: 0.5 }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPreview(false)} startIcon={<Close />}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleApply}
                        variant="contained"
                        color="primary"
                        startIcon={<Check />}
                    >
                        Aplicar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

import { Paper } from '@mui/material';
