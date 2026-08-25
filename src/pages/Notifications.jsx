import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid,
    TextField, Autocomplete, CircularProgress, Snackbar, Alert,
    TablePagination
} from '@mui/material';
import { Add, Notifications as NotificationsIcon, Send, History, Search } from '@mui/icons-material';
import { notificationService } from '../services/notificationService';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const NOTIFICATION_TYPES = [
    { value: 'ADMIN_ALERT', label: 'Alerta Administrativo' },
    { value: 'SUPPORT_RESPONSE', label: 'Resposta de Suporte' },
    { value: 'MARKETING', label: 'Informativo / Marketing' },
    { value: 'SYSTEM_MAINTENANCE', label: 'Manutenção do Sistema' },
];

export const Notifications = () => {
    const { user: authUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalNotifications, setTotalNotifications] = useState(0);

    const [openDialog, setOpenDialog] = useState(false);
    const [sending, setSending] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        userIds: [],
        title: '',
        body: '',
        type: 'ADMIN_ALERT',
        payload: ''
    });

    // User search state
    const [userOptions, setUserOptions] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await notificationService.getSentNotifications(page, pageSize);
            setNotifications(data.data);
            setTotalNotifications(data.total);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
            setSnackbar({ open: true, message: 'Erro ao carregar histórico de notificações', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Search users for autocomplete
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (userSearchQuery.length < 3) {
                setUserOptions([]);
                return;
            }
            setSearchingUsers(true);
            try {
                const response = await api.get('/admin/users', {
                    params: { search: userSearchQuery, pageSize: 50 }
                });
                // Adapt response if needed (assuming response.data.users exists)
                const users = response.data.users || [];
                setUserOptions(users.map(u => ({
                    id: u.id,
                    label: `${u.first_name || u.name} (${u.email})`,
                    email: u.email
                })));
            } catch (error) {
                console.error('Erro ao buscar usuários:', error);
            } finally {
                setSearchingUsers(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [userSearchQuery]);

    const handleSend = async () => {
        if (formData.userIds.length === 0 || !formData.title || !formData.body) {
            setSnackbar({ open: true, message: 'Preencha todos os campos obrigatórios', severity: 'warning' });
            return;
        }

        setSending(true);
        try {
            let parsedPayload = null;
            if (formData.payload) {
                try {
                    parsedPayload = JSON.parse(formData.payload);
                } catch (e) {
                    setSnackbar({ open: true, message: 'Payload JSON inválido', severity: 'error' });
                    setSending(false);
                    return;
                }
            }

            await notificationService.sendNotification({
                userIds: formData.userIds.map(u => u.id),
                title: formData.title,
                body: formData.body,
                type: formData.type,
                payload: parsedPayload
            });

            setSnackbar({ open: true, message: 'Notificações enviadas com sucesso!', severity: 'success' });
            setOpenDialog(false);
            setFormData({ userIds: [], title: '', body: '', type: 'ADMIN_ALERT', payload: '' });
            fetchNotifications();
        } catch (error) {
            console.error('Erro ao enviar notificações:', error);
            setSnackbar({ open: true, message: 'Erro ao enviar notificações', severity: 'error' });
        } finally {
            setSending(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage + 1);
    };

    const handleChangeRowsPerPage = (event) => {
        setPageSize(parseInt(event.target.value, 10));
        setPage(1);
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" display="flex" alignItems="center" gap={1}>
                    <NotificationsIcon color="primary" /> Central de Notificações
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Send />}
                    onClick={() => setOpenDialog(true)}
                >
                    Nova Notificação
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell>Data/Hora</TableCell>
                            <TableCell>Título</TableCell>
                            <TableCell>Mensagem</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Destinatário (ID)</TableCell>
                            <TableCell>Enviado por</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {notifications.map((notif) => (
                            <TableRow key={notif.id} hover>
                                <TableCell>{new Date(notif.created_at).toLocaleString()}</TableCell>
                                <TableCell><strong>{notif.title}</strong></TableCell>
                                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {notif.body}
                                </TableCell>
                                <TableCell>
                                    <Chip label={notif.type} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell>{notif.user_id}</TableCell>
                                <TableCell>{notif.sender_id || 'Sistema'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {loading && (
                    <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress />
                    </Box>
                )}
                {!loading && notifications.length === 0 && (
                    <Box textAlign="center" py={3}>
                        <Typography color="textSecondary">Nenhuma notificação enviada encontrada.</Typography>
                    </Box>
                )}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalNotifications}
                    rowsPerPage={pageSize}
                    page={page - 1}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Itens por página"
                />
            </TableContainer>

            {/* New Notification Dialog */}
            <Dialog open={openDialog} onClose={() => !sending && setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Enviar Nova Notificação</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} pt={1}>
                        <Grid item xs={12}>
                            <Autocomplete
                                multiple
                                options={userOptions}
                                loading={searchingUsers}
                                value={formData.userIds}
                                onChange={(event, newValue) => setFormData({ ...formData, userIds: newValue })}
                                onInputChange={(event, newInputValue) => setUserSearchQuery(newInputValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Destinatários *"
                                        placeholder="Pesquisar usuários por nome ou email..."
                                        helperText="Digite pelo menos 3 caracteres para pesquisar"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Título da Mensagem *"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Conteúdo da Mensagem *"
                                value={formData.body}
                                onChange={e => setFormData({ ...formData, body: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                select
                                fullWidth
                                label="Tipo"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                SelectProps={{ native: true }}
                            >
                                {NOTIFICATION_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Payload JSON (Opcional)"
                                placeholder='{"action": "view_project", "id": 123}'
                                value={formData.payload}
                                onChange={e => setFormData({ ...formData, payload: e.target.value })}
                                helperText="Formato JSON válido para ações personalizadas no app"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} disabled={sending}>Cancelar</Button>
                    <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={handleSend}
                        disabled={sending}
                    >
                        {sending ? 'Enviando...' : 'Enviar Agora'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
