import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid,
    TextField, MenuItem, Avatar, TablePagination, CircularProgress,
    Snackbar, Alert
} from '@mui/material';
import { Add, Edit, Delete, ManageAccounts, CardMembership, Visibility } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { api } from '../services/api';

const ROLES = ['Administrador', 'Gestor', 'Operador', 'Visualizador'];
const STATUS = ['Ativo', 'Inativo'];
const CERTIFICATE_TYPES = ['Bronze', 'Prata', 'Ouro', 'Diamante', 'Platina'];

export const Users = () => {
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);

    const [openForm, setOpenForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        role: 'Visualizador',
        status: 'Ativo',
    });

    const { projects } = useAdmin();
    const [openCertForm, setOpenCertForm] = useState(false);
    const [openCertList, setOpenCertList] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userCertificates, setUserCertificates] = useState([]);
    const [loadingCerts, setLoadingCerts] = useState(false);
    const [certData, setCertData] = useState({
        sponsorName: '',
        projectName: '',
        date: new Date().toISOString().split('T')[0],
        blockchainLink: '',
        type: 'Ouro'
    });
    const [savingCert, setSavingCert] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchUsers = useCallback(async () => {
        if (!authUser) return;
        setLoading(true);
        try {
            const token = await authUser.getIdToken();
            const response = await api.get('/admin/users', {
                params: { page, pageSize },
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.users);
            setTotalUsers(response.data.total);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            setSnackbar({ open: true, message: 'Erro ao carregar usuários', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [authUser, page, pageSize]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const fetchUserCertificates = async (userId) => {
        setLoadingCerts(true);
        try {
            const token = await authUser.getIdToken();
            const response = await api.get(`/admin/users/${userId}/certificates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserCertificates(response.data);
        } catch (error) {
            console.error('Erro ao buscar certificados do usuário:', error);
            setSnackbar({ open: true, message: 'Erro ao carregar certificados', severity: 'error' });
        } finally {
            setLoadingCerts(false);
        }
    };

    const handleOpenCertList = (user) => {
        setSelectedUser(user);
        fetchUserCertificates(user.id);
        setOpenCertList(true);
    };

    const handleOpenNewCert = () => {
        setCertData({
            sponsorName: selectedUser?.first_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : selectedUser?.name || '',
            projectName: '',
            date: new Date().toISOString().split('T')[0],
            blockchainLink: '',
            type: 'Ouro'
        });
        setOpenCertForm(true);
    };

    const handleViewCertificate = (cert) => {
        const viewData = {
            sponsorName: cert.sponsorName,
            projectName: cert.projectName,
            date: cert.date,
            blockchainLink: cert.blockchainLink,
            type: cert.type || 'Ouro'
        };
        const json = JSON.stringify(viewData);
        const encoded = btoa(unescape(encodeURIComponent(json)));
        window.open(`/certificate/view?d=${encoded}`, '_blank');
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage + 1);
    };

    const handleChangeRowsPerPage = (event) => {
        setPageSize(parseInt(event.target.value, 10));
        setPage(1);
    };

    const handleOpenNew = () => {
        setFormData({
            id: '',
            name: '',
            email: '',
            role: 'Visualizador',
            status: 'Ativo',
        });
        setIsEditing(false);
        setOpenForm(true);
    };

    const handleOpenEdit = (user) => {
        setFormData(user);
        setIsEditing(true);
        setOpenForm(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.email) {
            alert('Preencha os campos obrigatórios');
            return;
        }

        if (isEditing) {
            setUsers(users.map(u => u.id === formData.id ? formData : u));
        } else {
            const newUser = {
                ...formData,
                id: Math.max(...users.map(u => u.id), 0) + 1,
                createdAt: new Date().toISOString().split('T')[0],
            };
            setUsers([...users, newUser]);
        }

        setOpenForm(false);
    };

    const handleDelete = (userId) => {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            setUsers(users.filter(u => u.id !== userId));
        }
    };

    const getStatusColor = (status) => {
        return status === 'Ativo' ? 'success' : 'default';
    };

    const getRoleColor = (role) => {
        const colors = {
            'Administrador': 'error',
            'Gestor': 'warning',
            'Operador': 'info',
            'Visualizador': 'default',
        };
        return colors[role] || 'default';
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" display="flex" alignItems="center" gap={1}>
                    <ManageAccounts color="primary" /> Gestão de Usuários
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleOpenNew}
                >
                    Adicionar Usuário
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Usuário</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Função</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Cadastrado em</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {user.id}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            {(user.first_name || user.name || 'U').charAt(0)}
                                        </Avatar>
                                        <Typography variant="body2" fontWeight="bold">
                                            {user.first_name ? `${user.first_name} ${user.last_name}` : user.name}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.role || 'Operador'}
                                        color={getRoleColor(user.role || 'Operador')}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.status || 'Ativo'}
                                        color={getStatusColor(user.status || 'Ativo')}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : user.createdAt}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        color="info"
                                        onClick={() => handleOpenCertList(user)}
                                        title="Certificados"
                                    >
                                        <CardMembership />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleOpenEdit(user)}
                                        title="Editar"
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(user.id)}
                                        title="Excluir"
                                    >
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {loading && (
                    <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress />
                    </Box>
                )}
                {!loading && users.length === 0 && (
                    <Box textAlign="center" py={3}>
                        <Typography color="textSecondary">Nenhum usuário encontrado.</Typography>
                    </Box>
                )}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalUsers}
                    rowsPerPage={pageSize}
                    page={page - 1}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Itens por página"
                />
            </TableContainer>

            {/* Dialog Form */}
            <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} pt={1}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nome Completo *"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="email"
                                label="Email *"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                select
                                fullWidth
                                label="Função"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                {ROLES.map(role => (
                                    <MenuItem key={role} value={role}>{role}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                select
                                fullWidth
                                label="Status"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                {STATUS.map(status => (
                                    <MenuItem key={status} value={status}>{status}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave}>
                        {isEditing ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Certificate Form Dialog */}
            <Dialog open={openCertForm} onClose={() => setOpenCertForm(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Novo Certificado para {selectedUser?.first_name || selectedUser?.name}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} pt={1}>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Tipo de Certificado"
                                value={certData.type}
                                onChange={e => setCertData({ ...certData, type: e.target.value })}
                            >
                                {CERTIFICATE_TYPES.map(type => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nome do Patrocinador"
                                value={certData.sponsorName}
                                onChange={e => setCertData({ ...certData, sponsorName: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Nome do Projeto"
                                value={certData.projectName}
                                onChange={e => setCertData({ ...certData, projectName: e.target.value })}
                                helperText="Selecione um projeto existente"
                            >
                                {projects && projects.map((p) => (
                                    <MenuItem key={p.id} value={p.descricao}>
                                        {p.descricao}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Data"
                                InputLabelProps={{ shrink: true }}
                                value={certData.date}
                                onChange={e => setCertData({ ...certData, date: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Link do Blockchain (Opcional)"
                                value={certData.blockchainLink}
                                onChange={e => setCertData({ ...certData, blockchainLink: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCertForm(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            if (!certData.projectName || !certData.sponsorName) {
                                setSnackbar({ open: true, message: 'Preencha os campos obrigatórios', severity: 'warning' });
                                return;
                            }
                            setSavingCert(true);
                            try {
                                // Generate certificate URL same as standalone
                                const viewData = {
                                    sponsorName: certData.sponsorName,
                                    projectName: certData.projectName,
                                    date: certData.date,
                                    blockchainLink: certData.blockchainLink,
                                    type: certData.type || 'Ouro'
                                };
                                const json = JSON.stringify(viewData);
                                const encoded = btoa(unescape(encodeURIComponent(json)));
                                const certificateUrl = `/certificate/view?d=${encoded}`;

                                const token = await authUser.getIdToken();
                                await api.post(`/admin/users/${selectedUser.id}/certificates`, {
                                    ...certData,
                                    certificateUrl
                                }, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                setSnackbar({ open: true, message: 'Certificado salvo com sucesso!', severity: 'success' });
                                setOpenCertForm(false);
                                fetchUserCertificates(selectedUser.id);
                            } catch (error) {
                                console.error('Erro ao salvar certificado:', error);
                                setSnackbar({ open: true, message: 'Erro ao salvar certificado', severity: 'error' });
                            } finally {
                                setSavingCert(false);
                            }
                        }}
                        disabled={savingCert}
                    >
                        {savingCert ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* User Certificates List Dialog */}
            <Dialog open={openCertList} onClose={() => setOpenCertList(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Certificados: {selectedUser?.first_name || selectedUser?.name}
                    <Button startIcon={<Add />} variant="outlined" size="small" onClick={handleOpenNewCert}>
                        Novo Certificado
                    </Button>
                </DialogTitle>
                <DialogContent dividers>
                    {loadingCerts ? (
                        <Box display="flex" justifyContent="center" py={3}>
                            <CircularProgress />
                        </Box>
                    ) : userCertificates.length === 0 ? (
                        <Box textAlign="center" py={3}>
                            <Typography color="textSecondary">Nenhum certificado encontrado para este usuário.</Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Tipo</TableCell>
                                        <TableCell>Projeto</TableCell>
                                        <TableCell>Data</TableCell>
                                        <TableCell align="right">Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {userCertificates.map((cert) => (
                                        <TableRow key={cert.id}>
                                            <TableCell>
                                                <Chip label={cert.type} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell>{cert.projectName}</TableCell>
                                            <TableCell>{new Date(cert.date).toLocaleDateString()}</TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" color="primary" onClick={() => handleViewCertificate(cert)}>
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCertList(false)}>Fechar</Button>
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
