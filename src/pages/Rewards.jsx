import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid,
    TextField, MenuItem, CircularProgress, Alert, Avatar
} from '@mui/material';
import { Add, Edit, Delete, CardGiftcard, Refresh, Visibility, Image as ImageIcon } from '@mui/icons-material';
import { useAdmin } from '../contexts/AdminContext';

export const Rewards = () => {
    const {
        projects,
        getRewardsByManejoId,
        createReward,
        updateReward,
        deleteReward,
    } = useAdmin();

    const [selectedManejoId, setSelectedManejoId] = useState('');
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openForm, setOpenForm] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedReward, setSelectedReward] = useState(null);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        info: '',
        retail_price: '',
        reward_price: '',
        reward_qtd: '',
        foto_url: ''
    });

    // Load rewards when manejo is selected
    useEffect(() => {
        if (selectedManejoId) {
            loadRewards();
        }
    }, [selectedManejoId]);

    const loadRewards = async () => {
        if (!selectedManejoId) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getRewardsByManejoId(selectedManejoId);
            if (data) {
                setRewards(Array.isArray(data) ? data : []);
            } else {
                setRewards([]);
                setError('Não foi possível carregar as recompensas');
            }
        } catch (err) {
            console.error('Error loading rewards:', err);
            setError('Erro ao carregar recompensas');
            setRewards([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenNew = () => {
        setFormData({
            id: '',
            name: '',
            info: '',
            retail_price: '',
            reward_price: '',
            reward_qtd: '',
            foto_url: ''
        });
        setIsEditing(false);
        setOpenForm(true);
    };

    const handleOpenEdit = (reward) => {
        setFormData({
            id: reward.id || '',
            name: reward.name || '',
            info: reward.info || '',
            retail_price: reward.retail_price || '',
            reward_price: reward.reward_price || '',
            reward_qtd: reward.reward_qtd || '',
            foto_url: reward.foto_url || ''
        });
        setIsEditing(true);
        setOpenForm(true);
    };

    const handleOpenView = (reward) => {
        setSelectedReward(reward);
        setOpenView(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            alert('O nome é obrigatório');
            return;
        }

        if (!selectedManejoId) {
            alert('Selecione um manejo primeiro');
            return;
        }

        const payload = {
            name: formData.name,
            info: formData.info || '',
            retail_price: Number(formData.retail_price) || 0,
            reward_price: Number(formData.reward_price) || 0,
            reward_qtd: Number(formData.reward_qtd) || 0,
            foto_url: formData.foto_url || ''
        };

        try {
            if (isEditing) {
                const result = await updateReward(selectedManejoId, formData.id, payload);
                if (result) {
                    await loadRewards();
                    setOpenForm(false);
                } else {
                    alert('Erro ao atualizar recompensa');
                }
            } else {
                const result = await createReward(selectedManejoId, payload);
                if (result) {
                    await loadRewards();
                    setOpenForm(false);
                } else {
                    alert('Erro ao criar recompensa');
                }
            }
        } catch (err) {
            console.error('Error saving reward:', err);
            alert('Erro ao salvar recompensa');
        }
    };

    const handleDelete = async (rewardId) => {
        if (!confirm('Tem certeza que deseja excluir esta recompensa?')) {
            return;
        }

        const success = await deleteReward(selectedManejoId, rewardId);
        if (success) {
            await loadRewards();
        } else {
            alert('Erro ao excluir recompensa');
        }
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" display="flex" alignItems="center" gap={1}>
                    <CardGiftcard color="primary" /> Gerenciamento de Recompensas
                </Typography>
            </Box>

            {/* Manejo Selector */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            select
                            fullWidth
                            label="Selecione o Manejo"
                            value={selectedManejoId}
                            onChange={(e) => setSelectedManejoId(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>Selecione um manejo...</em>
                            </MenuItem>
                            {projects.map((project) => (
                                <MenuItem key={project.id} value={project.id}>
                                    {project.descricao} - {project.municipio}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={6} display="flex" gap={1}>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={loadRewards}
                            disabled={!selectedManejoId || loading}
                        >
                            Atualizar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleOpenNew}
                            disabled={!selectedManejoId}
                        >
                            Adicionar Recompensa
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Error Display */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Loading State */}
            {loading && (
                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    <CircularProgress />
                </Box>
            )}

            {/* Rewards Table */}
            {!loading && selectedManejoId && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f9fafb' }}>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nome</TableCell>
                                <TableCell>Descrição</TableCell>
                                <TableCell>Preço Varejo</TableCell>
                                <TableCell>Preço Recompensa</TableCell>
                                <TableCell>Quantidade</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rewards.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2" color="text.secondary" py={2}>
                                            Nenhuma recompensa cadastrada para este manejo
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rewards.map((reward) => (
                                    <TableRow key={reward.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {reward.id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar
                                                    src={reward.foto_url}
                                                    variant="rounded"
                                                    sx={{ width: 40, height: 40 }}
                                                >
                                                    <ImageIcon />
                                                </Avatar>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {reward.name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {reward.info || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {reward.retail_price ? (
                                                `R$ ${Number(reward.retail_price).toLocaleString('pt-BR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}`
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {reward.reward_price ? (
                                                `R$ ${Number(reward.reward_price).toLocaleString('pt-BR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}`
                                            ) : 'Grátis'}
                                        </TableCell>
                                        <TableCell>
                                            {reward.reward_qtd !== undefined ? reward.reward_qtd : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenView(reward)}
                                                title="Visualizar"
                                            >
                                                <Visibility />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="default"
                                                onClick={() => handleOpenEdit(reward)}
                                                title="Editar"
                                            >
                                                <Edit />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(reward.id)}
                                                title="Excluir"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* No Manejo Selected */}
            {!loading && !selectedManejoId && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <CardGiftcard sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Selecione um manejo para gerenciar suas recompensas
                    </Typography>
                </Paper>
            )}

            {/* Dialog Form */}
            <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {isEditing ? 'Editar Recompensa' : 'Nova Recompensa'}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} pt={1}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nome *"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Descrição"
                                value={formData.info}
                                onChange={e => setFormData({ ...formData, info: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Preço Varejo"
                                value={formData.retail_price}
                                onChange={e => setFormData({ ...formData, retail_price: e.target.value })}
                                inputProps={{ step: '0.01', min: '0' }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Preço Recompensa"
                                value={formData.reward_price}
                                onChange={e => setFormData({ ...formData, reward_price: e.target.value })}
                                inputProps={{ step: '0.01', min: '0' }}
                                helperText="0 = Grátis"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Quantidade Disponível"
                                value={formData.reward_qtd}
                                onChange={e => setFormData({ ...formData, reward_qtd: e.target.value })}
                                inputProps={{ min: '0' }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="URL da Foto"
                                value={formData.foto_url}
                                onChange={e => setFormData({ ...formData, foto_url: e.target.value })}
                                helperText="URL da imagem da recompensa"
                            />
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

            {/* Dialog View */}
            <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Detalhes da Recompensa</DialogTitle>
                <DialogContent dividers>
                    {selectedReward && (
                        <Box display="flex" flexDirection="column" gap={2}>
                            {selectedReward.foto_url ? (
                                <Box
                                    component="img"
                                    src={selectedReward.foto_url}
                                    alt={selectedReward.name}
                                    sx={{
                                        width: '100%',
                                        maxHeight: 300,
                                        objectFit: 'contain',
                                        borderRadius: 1,
                                        mb: 2,
                                        bgcolor: 'grey.100'
                                    }}
                                />
                            ) : (
                                <Box display="flex" justifyContent="center" alignItems="center" height={150} bgcolor="grey.100" borderRadius={1} mb={2}>
                                    <ImageIcon sx={{ fontSize: 60, color: 'grey.300' }} />
                                </Box>
                            )}
                            <Typography variant="h6">{selectedReward.name}</Typography>
                            <Typography variant="body1" color="text.secondary">
                                {selectedReward.info || "Sem descrição"}
                            </Typography>
                            <Box display="flex" justifyContent="space-between" mt={1}>
                                <Box>
                                    <Typography variant="caption" color="textSecondary">Preço Varejo</Typography>
                                    <Typography variant="body1">
                                        {selectedReward.retail_price ? `R$ ${Number(selectedReward.retail_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="textSecondary">Preço Recompensa</Typography>
                                    <Typography variant="body1" fontWeight="bold" color="primary">
                                        {selectedReward.reward_price ? `R$ ${Number(selectedReward.reward_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Grátis'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="textSecondary">Qtd.</Typography>
                                    <Typography variant="body1">{selectedReward.reward_qtd}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenView(false)}>Fechar</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setOpenView(false);
                            handleOpenEdit(selectedReward);
                        }}
                    >
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
