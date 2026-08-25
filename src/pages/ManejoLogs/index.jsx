import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Grid, Divider, Tooltip, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, Pagination, Alert
} from '@mui/material';
import { Visibility, Restore, FilterList, History, InfoOutlined } from '@mui/icons-material';
import { api } from '../../services/api';

export const ManejoLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [openDetail, setOpenDetail] = useState(false);
    const [openRevert, setOpenRevert] = useState(false);
    const [reverting, setReverting] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);
    const [alertSeverity, setAlertSeverity] = useState('success');

    // Filters
    const [manejoId, setManejoId] = useState('');
    const [actionType, setActionType] = useState('');
    const [tableName, setTableName] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 15
            };
            if (manejoId) params.manejoId = manejoId;
            if (actionType) params.actionType = actionType;
            if (tableName) params.tableName = tableName;

            const response = await api.get('/api/v1/manejo/actions-log', { params });
            if (response.data) {
                setLogs(response.data.data || []);
                setTotalPages(response.data.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching manejo logs:', error);
            showFeedback('Erro ao carregar logs do manejo.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [page, actionType, tableName]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadLogs();
    };

    const handleClearFilters = () => {
        setManejoId('');
        setActionType('');
        setTableName('');
        setPage(1);
    };

    const showFeedback = (msg, severity = 'success') => {
        setAlertMsg(msg);
        setAlertSeverity(severity);
        setTimeout(() => setAlertMsg(null), 6000);
    };

    const handleOpenDetail = (log) => {
        setSelectedLog(log);
        setOpenDetail(true);
    };

    const handleOpenRevert = (log) => {
        setSelectedLog(log);
        setOpenRevert(true);
    };

    const handleRevert = async () => {
        if (!selectedLog) return;
        setReverting(true);
        try {
            const response = await api.post(`/api/v1/manejo/actions-log/${selectedLog.id}/revert`);
            if (response.status === 200) {
                showFeedback('Ação revertida com sucesso no banco de dados e blockchain!', 'success');
                setOpenRevert(false);
                setOpenDetail(false);
                loadLogs();
            }
        } catch (error) {
            console.error('Revert execution failed:', error);
            const errMsg = error.response?.data?.error || 'Não foi possível reverter esta alteração. Verifique se existem modificações mais recentes na mesma árvore.';
            showFeedback(errMsg, 'error');
        } finally {
            setReverting(false);
        }
    };

    const getActionBadgeColor = (type) => {
        switch (type) {
            case 'insert': return 'success';
            case 'update': return 'info';
            case 'delete': return 'error';
            default: return 'default';
        }
    };

    const getActionBadgeLabel = (type) => {
        switch (type) {
            case 'insert': return 'Inserção';
            case 'update': return 'Atualização';
            case 'delete': return 'Remoção';
            default: return type;
        }
    };

    const renderDiff = (before, after) => {
        const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

        return (
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Propriedade</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Estado Anterior</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Novo Estado</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {[...keys].map(key => {
                            const valBefore = before?.[key];
                            const valAfter = after?.[key];
                            const isChanged = JSON.stringify(valBefore) !== JSON.stringify(valAfter);

                            if (key === 'updatedAt' || key === 'createdAt' || typeof valBefore === 'object' && valBefore !== null) return null;

                            return (
                                <TableRow key={key} sx={{ bgcolor: isChanged ? 'rgba(255, 145, 0, 0.05)' : 'inherit' }}>
                                    <TableCell sx={{ fontWeight: isChanged ? 'bold' : 'normal', width: '25%' }}>{key}</TableCell>
                                    <TableCell sx={{ color: isChanged ? 'error.main' : 'inherit', textDecoration: isChanged ? 'line-through' : 'none', width: '37.5%' }}>
                                        {valBefore !== null && valBefore !== undefined ? String(valBefore) : '-'}
                                    </TableCell>
                                    <TableCell sx={{ color: isChanged ? 'success.main' : 'inherit', fontWeight: isChanged ? 'bold' : 'normal', width: '37.5%' }}>
                                        {valAfter !== null && valAfter !== undefined ? String(valAfter) : '-'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s', p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" display="flex" alignItems="center" gap={1.5} sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <History color="primary" sx={{ fontSize: 36 }} /> Logs e Reversões do Manejo
                </Typography>
            </Box>

            {alertMsg && (
                <Alert severity={alertSeverity} sx={{ mb: 3 }} onClose={() => setAlertMsg(null)}>
                    {alertMsg}
                </Alert>
            )}

            {/* Filters Form */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <form onSubmit={handleSearch}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                label="ID do Manejo"
                                variant="outlined"
                                size="small"
                                value={manejoId}
                                onChange={(e) => setManejoId(e.target.value)}
                                placeholder="Filtrar por Manejo..."
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo de Ação</InputLabel>
                                <Select
                                    value={actionType}
                                    onChange={(e) => setActionType(e.target.value)}
                                    label="Tipo de Ação"
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="insert">Inserção</MenuItem>
                                    <MenuItem value="update">Atualização</MenuItem>
                                    <MenuItem value="delete">Remoção</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tabela</InputLabel>
                                <Select
                                    value={tableName}
                                    onChange={(e) => setTableName(e.target.value)}
                                    label="Tabela"
                                >
                                    <MenuItem value="">Todas</MenuItem>
                                    <MenuItem value="arpt_arvore_inventario">Árvores</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3} display="flex" gap={1}>
                            <Button variant="contained" color="primary" type="submit" startIcon={<FilterList />}>
                                Filtrar
                            </Button>
                            <Button variant="outlined" color="secondary" onClick={handleClearFilters}>
                                Limpar
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Data/Hora</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Usuário</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Manejo ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Tabela</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Ação</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Revertido</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                    <CircularProgress size={32} />
                                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Carregando logs...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                    <InfoOutlined color="action" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="body1" color="textSecondary">Nenhum registro de modificação encontrado.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : logs.map((log) => (
                            <TableRow key={log.id} hover sx={{ bgcolor: log.is_reverted ? 'rgba(0, 0, 0, 0.02)' : 'inherit' }}>
                                <TableCell>{new Date(log.created_at).toLocaleString('pt-BR')}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {log.user_email || log.user_id}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip label={`Manejo #${log.manejo_id}`} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                    {log.table_name === 'arpt_arvore_inventario' ? 'Árvores' : log.table_name}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={getActionBadgeLabel(log.action_type)}
                                        size="small"
                                        color={getActionBadgeColor(log.action_type)}
                                        sx={{ minWidth: 90, textAlign: 'center' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    {log.is_reverted ? (
                                        <Chip label="Revertido" size="small" color="warning" variant="filled" />
                                    ) : (
                                        <Typography variant="body2" color="textSecondary">Não</Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" color="primary" onClick={() => handleOpenDetail(log)}>
                                        <Visibility />
                                    </IconButton>
                                    {!log.is_reverted && (
                                        <IconButton size="small" color="warning" onClick={() => handleOpenRevert(log)} title="Desfazer/Reverter">
                                            <Restore />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(e, value) => setPage(value)}
                        color="primary"
                    />
                </Box>
            )}

            {/* Detail Dialog */}
            <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Detalhes da Modificação</DialogTitle>
                <DialogContent dividers>
                    {selectedLog && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="caption" color="textSecondary">Usuário Responsável</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedLog.user_email || selectedLog.user_id}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="caption" color="textSecondary">Data/Hora da Ação</Typography>
                                <Typography variant="body1">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="caption" color="textSecondary">Tabela / ID Linha</Typography>
                                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                    {selectedLog.table_name} (ID: {selectedLog.row_id})
                                </Typography>
                            </Grid>
                            {selectedLog.is_reverted && (
                                <Grid item xs={12}>
                                    <Alert severity="warning" variant="outlined">
                                        Esta modificação já foi revertida pelo sistema.
                                    </Alert>
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <Divider sx={{ my: 1.5 }} />
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                                    Mudanças de Atributos:
                                </Typography>
                                {renderDiff(selectedLog.before_state, selectedLog.after_state)}
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenDetail(false)}>Fechar</Button>
                    {selectedLog && !selectedLog.is_reverted && (
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={<Restore />}
                            onClick={() => handleOpenRevert(selectedLog)}
                        >
                            Desfazer Alteração
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Revert Confirmation Dialog */}
            <Dialog open={openRevert} onClose={() => !reverting && setOpenRevert(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Confirmar Reversão Transactional</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        A reversão restaurará com total segurança o estado anterior registrado neste log, tanto no banco de dados local quanto no registro de auditoria da Blockchain.
                    </Typography>
                    <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                        Aviso: Esta reversão falhará se houver modificações sequenciais mais recentes realizadas na mesma árvore.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenRevert(false)} disabled={reverting}>Cancelar</Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleRevert}
                        disabled={reverting}
                    >
                        {reverting ? <CircularProgress size={20} /> : 'Confirmar e Reverter'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManejoLogs;
