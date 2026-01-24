import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, List, ListItem, ListItemText, ListItemSecondaryAction,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    CircularProgress, MenuItem, Paper
} from '@mui/material';
import { Add, Delete, Description, Download } from '@mui/icons-material';
import { useAdmin } from '../../../contexts/AdminContext';

const DOC_TYPES = ['Licença', 'Relatório', 'Contrato', 'Mapa', 'Outro'];

export const ProjectDocs = ({ projectId }) => {
    const { getDocsByManejoId, createDoc, deleteDoc } = useAdmin();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        titulo: '',
        tipo: 'Outro',
        url: ''
    });

    useEffect(() => {
        if (projectId) {
            fetchDocs();
        }
    }, [projectId]);

    const fetchDocs = async () => {
        setLoading(true);
        const data = await getDocsByManejoId(projectId);
        if (data) {
            setDocs(data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.titulo) {
            alert('Título é obrigatório');
            return;
        }

        const payload = { ...formData };
        // In a real app, we might handle file upload here via FormData
        // For now assuming JSON payload with URL or just metadata

        const success = await createDoc(projectId, payload);
        if (success) {
            fetchDocs();
            setOpenDialog(false);
            setFormData({ titulo: '', tipo: 'Outro', url: '' });
        } else {
            alert('Erro ao salvar documento');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este documento?')) {
            const success = await deleteDoc(projectId, id);
            if (success) {
                fetchDocs();
            } else {
                alert('Erro ao excluir documento');
            }
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Documentos do Projeto</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
                    Novo Documento
                </Button>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                </Box>
            ) : docs.length === 0 ? (
                <Typography color="textSecondary" align="center">Nenhum documento cadastrado.</Typography>
            ) : (
                <Paper variant="outlined">
                    <List>
                        {docs.map((doc, index) => (
                            <ListItem key={doc.id || index} divider={index !== docs.length - 1}>
                                <ListItemText
                                    primary={doc.titulo}
                                    secondary={`${doc.tipo} - ${new Date(doc.createdAt || Date.now()).toLocaleDateString()}`}
                                />
                                <ListItemSecondaryAction>
                                    {doc.url && (
                                        <IconButton edge="end" href={doc.url} target="_blank" title="Download/Visualizar">
                                            <Download />
                                        </IconButton>
                                    )}
                                    <IconButton edge="end" color="error" onClick={() => handleDelete(doc.id)}>
                                        <Delete />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Novo Documento</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} pt={1}>
                        <TextField
                            label="Título"
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            select
                            label="Tipo"
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            fullWidth
                        >
                            {DOC_TYPES.map(t => (
                                <MenuItem key={t} value={t}>{t}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="URL / Link"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            fullWidth
                            placeholder="https://..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave}>Salvar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
