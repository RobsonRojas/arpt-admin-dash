import { useState } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid,
    TextField, MenuItem, Avatar,
} from '@mui/material';
import { Add, Edit, Delete, ManageAccounts } from '@mui/icons-material';

const ROLES = ['Administrador', 'Gestor', 'Operador', 'Visualizador'];
const STATUS = ['Ativo', 'Inativo'];

export const Users = () => {
    const [users, setUsers] = useState([
        { id: 1, name: 'João Silva', email: 'joao@arpt.com', role: 'Administrador', status: 'Ativo', createdAt: '2024-01-15' },
        { id: 2, name: 'Maria Santos', email: 'maria@arpt.com', role: 'Gestor', status: 'Ativo', createdAt: '2024-02-20' },
        { id: 3, name: 'Pedro Costa', email: 'pedro@arpt.com', role: 'Operador', status: 'Inativo', createdAt: '2024-03-10' },
    ]);

    const [openForm, setOpenForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        role: 'Visualizador',
        status: 'Ativo',
    });

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
                                            {user.name.charAt(0)}
                                        </Avatar>
                                        <Typography variant="body2" fontWeight="bold">
                                            {user.name}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.role}
                                        color={getRoleColor(user.role)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.status}
                                        color={getStatusColor(user.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{user.createdAt}</TableCell>
                                <TableCell align="right">
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
        </Box>
    );
};
