import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Grid, TextField, MenuItem, 
    CircularProgress, Alert, Stack
} from '@mui/material';
import { Add, CardGiftcard, Refresh } from '@mui/icons-material';
import { useAdmin } from '../contexts/AdminContext';
import { usePersistence } from '../hooks/usePersistence';

// Sub-components
import { RewardList } from '../components/modules/rewards/RewardList';
import { RewardFormDialog } from '../components/modules/rewards/RewardFormDialog';
import { RewardViewDialog } from '../components/modules/rewards/RewardViewDialog';

export const Rewards = () => {
    // Skip link for screen readers
    const skipRef = useRef(null);
    const handleSkip = (e) => {
        e.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.tabIndex = -1;
            mainContent.focus();
            setTimeout(() => {
                mainContent.removeAttribute('tabindex');
            }, 100);
        }
    };
    const {
        projects,
        getRewardsByManejoId,
        createReward,
        updateReward,
        deleteReward,
        getProducts
    } = useAdmin();

    const [selectedManejoId, setSelectedManejoId] = useState('');
    const [rewards, setRewards] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openForm, setOpenForm] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedReward, setSelectedReward] = useState(null);

    // Form state with Persistence
    const [persistenceKey, setPersistenceKey] = useState('reward_draft_new');
    const [formData, setFormData, clearDraft] = usePersistence(persistenceKey, {
        id: '',
        id_manejo: '',
        id_produto: '',
        reward_price: '',
        reward_qtd: '',
        delivery: '',
        qtd_products: ''
    });

    const [imgError, setImgError] = useState(false);

    // Memoized loaders
    const loadProducts = useCallback(async () => {
        try {
            const data = await getProducts();
            setProducts(data || []);
        } catch (err) {
            console.error('Error loading products:', err);
        }
    }, [getProducts]);

    const loadRewards = useCallback(async () => {
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
    }, [selectedManejoId, getRewardsByManejoId]);

    // Effects
    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    useEffect(() => {
        if (selectedManejoId) {
            loadRewards();
        }
    }, [selectedManejoId, loadRewards]);

    // Handlers
    const handleOpenNew = () => {
        setImgError(false);
        const key = 'reward_draft_new';
        setPersistenceKey(key);
        setFormData({
            id: '',
            id_manejo: selectedManejoId,
            id_produto: '',
            reward_price: '',
            reward_qtd: '',
            delivery: '',
            qtd_products: ''
        });
        setIsEditing(false);
        setOpenForm(true);
    };

    const handleOpenEdit = (reward) => {
        setImgError(false);
        const key = `reward_draft_${reward.id}`;
        setPersistenceKey(key);
        setFormData({
            id: reward.id || '',
            id_manejo: selectedManejoId,
            id_produto: reward.id_produto || '',
            reward_price: reward.reward_price || '',
            reward_qtd: reward.reward_qtd || '',
            delivery: reward.delivery || '',
            qtd_products: reward.qtd || ''
        });
        setIsEditing(true);
        setOpenForm(true);
    };

    const handleOpenView = (reward) => {
        setImgError(false);
        setSelectedReward(reward);
        setOpenView(true);
    };

    const handleSave = async () => {
        if (!formData.id_produto) {
            alert('A seleção de um produto é obrigatória');
            return;
        }

        if (!selectedManejoId) {
            alert('Selecione um manejo primeiro');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                id_produto: Number(formData.id_produto),
                reward_price: Number(formData.reward_price) || 0,
                reward_qtd: Number(formData.reward_qtd) || 0,
                delivery: formData.delivery,
                qtd_products: Number(formData.qtd_products) || 0
            };

            let result;
            if (isEditing) {
                result = await updateReward(selectedManejoId, formData.id, payload);
            } else {
                result = await createReward(selectedManejoId, payload);
            }

            if (result) {
                await loadRewards();
                await clearDraft();
                setOpenForm(false);
            } else {
                alert('Erro ao salvar recompensa');
            }
        } catch (err) {
            console.error('Error saving reward:', err);
            alert('Erro ao salvar recompensa');
        } finally {
            setLoading(false);
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
        <>
            <a href="#main-content" onClick={handleSkip} ref={skipRef} style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>Skip to main content</a>
            <Box sx={{ animation: 'fadeIn 0.5s', p: { xs: 1, sm: 2 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} mb={3}>
                    <Typography variant="h5" display="flex" alignItems="center" gap={1} fontWeight="bold">
                        <CardGiftcard color="primary" /> Gerenciamento de Recompensas
                    </Typography>
                    
                    <Stack direction="row" spacing={1} width={{ xs: '100%', sm: 'auto' }}>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={loadRewards}
                            disabled={!selectedManejoId || loading}
                            sx={{ flex: 1 }}
                        >
                            Atualizar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleOpenNew}
                            disabled={!selectedManejoId}
                            sx={{ flex: 1 }}
                        >
                            Adicionar
                        </Button>
                    </Stack>
                </Stack>

                {/* Manejo Selector */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 1 }} id="main-content">
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="Selecione o Projeto de Manejo"
                                value={selectedManejoId}
                                onChange={(e) => setSelectedManejoId(e.target.value)}
                                helperText="Escolha um manejo para visualizar ou gerenciar suas recompensas"
                            >
                                <MenuItem value="">
                                    <em>Selecione um projeto...</em>
                                </MenuItem>
                                {projects.map((project) => (
                                    <MenuItem key={project.id} value={project.id}>
                                        {project.descricao} - {project.municipio}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Error Display */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Content Area */}
                {loading && rewards.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                        <CircularProgress />
                    </Box>
                ) : selectedManejoId ? (
                    <RewardList 
                        rewards={rewards}
                        handleOpenView={handleOpenView}
                        handleOpenEdit={handleOpenEdit}
                        handleDelete={handleDelete}
                    />
                ) : (
                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: 'grey.50', border: '2px dashed', borderColor: 'grey.300' }}>
                        <CardGiftcard sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Nenhum manejo selecionado
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Selecione um manejo acima para visualizar e gerenciar as recompensas disponíveis.
                        </Typography>
                    </Paper>
                )}

                {/* Dialogs */}
                <RewardFormDialog 
                    open={openForm}
                    onClose={() => setOpenForm(false)}
                    isEditing={isEditing}
                    formData={formData}
                    setFormData={setFormData}
                    products={products}
                    handleSave={handleSave}
                    loading={loading}
                />

                <RewardViewDialog 
                    open={openView}
                    onClose={() => setOpenView(false)}
                    reward={selectedReward}
                    imgError={imgError}
                    setImgError={setImgError}
                    handleOpenEdit={handleOpenEdit}
                />
            </Box>
        </>
    );
};
