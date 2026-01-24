import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    CircularProgress, Chip, MenuItem
} from '@mui/material';
import { Add, Delete, Warning } from '@mui/icons-material';
import { useAdmin } from '../../../contexts/AdminContext';

const INCIDENT_TYPES = ['Desmatamento Ilegal', 'Incêndio', 'Invasão', 'Outros'];
const INCIDENT_STATUS = ['Aberto', 'Em Análise', 'Resolvido'];

export const ProjectIncidents = ({ projectId }) => {
    const { getIncidentsByManejoId, createIncident, updateIncident, deleteIncident } = useAdmin();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingIncident, setEditingIncident] = useState(null); // Although implementation plan didn't explicitly ask for edit, it's good practice.
    const [formData, setFormData] = useState({
        data: new Date().toISOString().split('T')[0],
        tipo: 'Outros',
        descricao: '',
        status: 'Aberto'
    });

    useEffect(() => {
        if (projectId) {
            fetchIncidents();
        }
    }, [projectId]);

    const fetchIncidents = async () => {
        setLoading(true);
        const data = await getIncidentsByManejoId(projectId);
        if (data) {
            setIncidents(data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.descricao) {
            alert('Descrição é obrigatória');
            return;
        }

        const success = await createIncident(projectId, formData);
        if (success) {
            fetchIncidents();
            setOpenDialog(false);
            setFormData({
                data: new Date().toISOString().split('T')[0],
                tipo: 'Outros',
                descricao: '',
                status: 'Aberto'
            });
        } else {
            alert('Erro ao registrar incidente');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este incidente?')) {
            const success = await deleteIncident(projectId, id);
            if (success) {
                fetchIncidents();
            } else {
                alert('Erro ao excluir incidente');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolvido': return 'success';
            case 'Em Análise': return 'warning';
            case 'Aberto': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Incidentes e Alertas</Typography>
                <Button variant="contained" color="error" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
                    Novo Incidente
                </Button>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                </Box>
            ) : incidents.length === 0 ? (
                <Typography color="textSecondary" align="center">Nenhum incidente registrado.</Typography>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Data</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Descrição</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Ação</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {incidents.map((inc) => (
                                <TableRow key={inc.id}>
                                    <TableCell>{new Date(inc.data).toLocaleDateString()}</TableCell>
                                    <TableCell>{inc.tipo}</TableCell>
                                    <TableCell>{inc.descricao}</TableCell>
                                    <TableCell>
                                        <Chip label={inc.status} color={getStatusColor(inc.status)} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="error" onClick={() => handleDelete(inc.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Registrar Incidente</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} pt={1}>
                        <TextField
                            label="Data"
                            type="date"
                            value={formData.data}
                            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            select
                            label="Tipo"
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            fullWidth
                        >
                            {INCIDENT_TYPES.map(t => (
                                <MenuItem key={t} value={t}>{t}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Descrição"
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                            required
                        />
                        <TextField
                            select
                            label="Status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            fullWidth
                        >
                            {INCIDENT_STATUS.map(s => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={handleSave}>Registrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
