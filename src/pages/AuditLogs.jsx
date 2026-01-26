import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Grid, Divider, Tooltip, CircularProgress
} from '@mui/material';
import { Visibility, Restore, FilterList, History } from '@mui/icons-material';
import { fetchAuditLogs, recordAudit } from '../services/auditLog';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

export const AuditLogs = () => {
    const { user } = useAuth();
    const adminContext = useAdmin();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [openDetail, setOpenDetail] = useState(false);
    const [openRevert, setOpenRevert] = useState(false);
    const [justification, setJustification] = useState('');
    const [reverting, setReverting] = useState(false);

    const loadLogs = async () => {
        setLoading(true);
        const data = await fetchAuditLogs();
        setLogs(data);
        setLoading(false);
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const handleOpenDetail = (log) => {
        setSelectedLog(log);
        setOpenDetail(true);
    };

    const handleOpenRevert = (log) => {
        setSelectedLog(log);
        setJustification('');
        setOpenRevert(true);
    };

    const handleRevert = async () => {
        if (!justification.trim()) {
            alert('Justificativa é obrigatória para reversão.');
            return;
        }

        setReverting(true);
        try {
            const { entity, entityId, before } = selectedLog;

            // Mapping entities to context functions
            const revertMap = {
                'PROJECT': adminContext.updateProject,
                'PROPERTY': adminContext.handleUpdateProperty,
                'REWARD': (obj) => adminContext.updateReward(obj.manejoId, obj.productId, obj),
                'PRODUCT': async (obj) => {
                    const { api } = await import('../services/api');
                    return api.put(`/produtos/${obj.id}`, obj);
                }
            };

            const revertFunc = revertMap[entity];

            if (revertFunc && before) {
                await revertFunc(before);

                // Record the REVERT action
                await recordAudit({
                    action: 'REVERT',
                    entity,
                    entityId,
                    before: selectedLog.after, // The current state (was after in the log we're reverting)
                    after: before,
                    user,
                    justification: `REVERT do log ${selectedLog.id}: ${justification}`
                });

                alert('Modificação revertida com sucesso!');
                setOpenRevert(false);
                setOpenDetail(false);
                loadLogs();
            } else {
                alert('Esta ação não pode ser revertida automaticamente (dados incompletos ou entidade não suportada).');
            }
        } catch (error) {
            console.error('Error during revert:', error);
            alert('Erro ao tentar reverter modificação.');
        } finally {
            setReverting(false);
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'success';
            case 'UPDATE': return 'info';
            case 'DELETE': return 'error';
            case 'REVERT': return 'warning';
            default: return 'default';
        }
    };

    const renderDiff = (before, after) => {
        const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

        return (
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Campo</TableCell>
                        <TableCell>Antes</TableCell>
                        <TableCell>Depois</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {[...keys].map(key => {
                        const valBefore = before?.[key];
                        const valAfter = after?.[key];
                        const isChanged = JSON.stringify(valBefore) !== JSON.stringify(valAfter);

                        if (key === 'timestamp' || key === 'id' || typeof valBefore === 'object' && valBefore !== null) return null;

                        return (
                            <TableRow key={key} sx={{ bgcolor: isChanged ? 'action.hover' : 'inherit' }}>
                                <TableCell sx={{ fontWeight: isChanged ? 'bold' : 'normal' }}>{key}</TableCell>
                                <TableCell sx={{ color: isChanged ? 'error.main' : 'inherit', textDecoration: isChanged ? 'line-through' : 'none' }}>
                                    {String(valBefore ?? '')}
                                </TableCell>
                                <TableCell sx={{ color: isChanged ? 'success.main' : 'inherit', fontWeight: isChanged ? 'bold' : 'normal' }}>
                                    {String(valAfter ?? '')}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" display="flex" alignItems="center" gap={1}>
                    <History color="primary" /> Log de Modificações
                </Typography>
                <Button startIcon={<FilterList />} variant="outlined" onClick={loadLogs}>
                    Atualizar Log
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell>Data/Hora</TableCell>
                            <TableCell>Usuário</TableCell>
                            <TableCell>Ação</TableCell>
                            <TableCell>Entidade</TableCell>
                            <TableCell>ID Entidade</TableCell>
                            <TableCell>IP</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : logs.map((log) => (
                            <TableRow key={log.id} hover>
                                <TableCell>{log.timestamp?.toLocaleString('pt-BR')}</TableCell>
                                <TableCell>
                                    <Tooltip title={log.userEmail}>
                                        <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {log.userEmail}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={log.action}
                                        size="small"
                                        color={getActionColor(log.action)}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{log.entity}</TableCell>
                                <TableCell>{log.entityId}</TableCell>
                                <TableCell>{log.ip}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" color="primary" onClick={() => handleOpenDetail(log)}>
                                        <Visibility />
                                    </IconButton>
                                    {log.action === 'UPDATE' && (
                                        <IconButton size="small" color="warning" onClick={() => handleOpenRevert(log)}>
                                            <Restore />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Detail Dialog */}
            <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
                <DialogTitle>Detalhes da Modificação</DialogTitle>
                <DialogContent dividers>
                    {selectedLog && (
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Usuário</Typography>
                                <Typography variant="body1">{selectedLog.userEmail}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Data/Hora</Typography>
                                <Typography variant="body1">{selectedLog.timestamp?.toLocaleString('pt-BR')}</Typography>
                            </Grid>
                            {selectedLog.justification && (
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="textSecondary">Justificativa/Comentário</Typography>
                                    <Paper sx={{ p: 1, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                                        <Typography variant="body2">{selectedLog.justification}</Typography>
                                    </Paper>
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" gutterBottom>Comparação de Dados</Typography>
                                {renderDiff(selectedLog.before, selectedLog.after)}
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetail(false)}>Fechar</Button>
                    {selectedLog?.action === 'UPDATE' && (
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={<Restore />}
                            onClick={() => handleOpenRevert(selectedLog)}
                        >
                            Reverter esta Mudança
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Revert Dialog */}
            <Dialog open={openRevert} onClose={() => !reverting && setOpenRevert(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirmar Reversão</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        A reversão restaurará os valores anteriores ao estado capturado neste log.
                        Esta ação criará um novo registro de log.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Justificativa Obrigatória"
                        multiline
                        rows={3}
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRevert(false)} disabled={reverting}>Cancelar</Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleRevert}
                        disabled={reverting || !justification.trim()}
                    >
                        {reverting ? <CircularProgress size={20} /> : 'Confirmar Reversão'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
