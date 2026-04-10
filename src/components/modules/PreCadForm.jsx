import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Grid, Divider
} from '@mui/material';
import { useAdmin } from '../../contexts/AdminContext';

export const PreCadForm = ({ open, onClose, project, purchase, onSave }) => {
    const { getRewardsByManejoId, registerManualPurchase, updatePurchase } = useAdmin();
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        user_name: '',
        full_name: '',
        user_email: '',
        user_cpf: '',
        cpf_cnpj: '',
        id_arpt_produto_manejo: '',
        qtd: 1,
        totalPrice: 0,
        user_id: '',
        payment_mp_data: '{}'
    });

    useEffect(() => {
        if (open && project) {
            fetchRewards();
            if (purchase) {
                setFormData({
                    user_name: purchase.user_name || '',
                    full_name: purchase.full_name || '',
                    user_email: purchase.user_email || '',
                    user_cpf: purchase.user_cpf || '',
                    cpf_cnpj: purchase.cpf_cnpj || '',
                    id_arpt_produto_manejo: purchase.id_arpt_produto_manejo || '',
                    qtd: purchase.qtd || 1,
                    user_id: purchase.user_id || '',
                    payment_mp_data: purchase.payment_mp_data || '{}',
                    // TotalPrice usually not needed for update, but kept for consistency
                    totalPrice: 0 
                });
            } else {
                setFormData({
                    user_name: '',
                    full_name: '',
                    user_email: '',
                    user_cpf: '',
                    cpf_cnpj: '',
                    id_arpt_produto_manejo: '',
                    qtd: 1,
                    totalPrice: 0,
                    user_id: '',
                    payment_mp_data: '{}'
                });
            }
        }
    }, [open, project, purchase]);

    const fetchRewards = async () => {
        setLoading(true);
        const data = await getRewardsByManejoId(project.id);
        if (data) {
            setRewards(data);
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.user_email || !formData.id_arpt_produto_manejo) {
            alert('E-mail e Recompensa são obrigatórios');
            return;
        }

        const confirmMsg = purchase 
            ? 'Tem certeza que deseja atualizar os dados deste pré-cadastro?' 
            : 'Confirma o registro desta venda manual? Isso atualizará o estoque e o saldo do manejo.';
        
        if (!window.confirm(confirmMsg)) return;

        setSaving(true);
        try {
            if (purchase) {
                // Update
                const { totalPrice, ...updateData } = formData;
                await updatePurchase(purchase.id, updateData);
            } else {
                // Register
                await registerManualPurchase(formData);
            }
            onSave();
            onClose();
        } catch (error) {
            alert('Erro ao salvar pre-cadastro: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            fullScreen={{ xs: true, sm: false }}
        >
            <DialogTitle sx={{ p: { xs: 2, sm: 3 } }}>
                {purchase ? 'Editar Pré-cadastro' : 'Nova Venda Manual'}
                <Typography variant="caption" display="block" color="textSecondary">
                    Projeto: {project?.descricao}
                </Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
                ) : (
                    <Box display="flex" flexDirection="column" gap={2} pt={1}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Apoiador (Nome Público)"
                                    name="user_name"
                                    value={formData.user_name}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Nome Completo (Recibo)"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="E-mail"
                                    name="user_email"
                                    type="email"
                                    value={formData.user_email}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="CPF/CNPJ Usuário"
                                    name="user_cpf"
                                    value={formData.user_cpf}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="CPF/CNPJ Recibo"
                                    name="cpf_cnpj"
                                    value={formData.cpf_cnpj}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" gutterBottom>Detalhes da Compra</Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    select
                                    label="Recompensa / Produto"
                                    name="id_arpt_produto_manejo"
                                    value={formData.id_arpt_produto_manejo}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                >
                                    {rewards.map(r => (
                                        <MenuItem key={r.id} value={r.id}>
                                            {r.nome} - R$ {parseFloat(r.reward_price).toLocaleString('pt-BR')}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Quantidade"
                                    name="qtd"
                                    type="number"
                                    value={formData.qtd}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Grid>
                            {!purchase && (
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Valor Pago (Total)"
                                        name="totalPrice"
                                        type="number"
                                        value={formData.totalPrice}
                                        onChange={handleChange}
                                        fullWidth
                                        helperText="Valor que será somado ao Manejo"
                                    />
                                </Grid>
                            )}
                            
                            <Grid item xs={12}>
                                <TextField
                                    label="ID do Usuário (Firebase UID)"
                                    name="user_id"
                                    value={formData.user_id}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Metadados JSON (payment_mp_data)"
                                    name="payment_mp_data"
                                    value={formData.payment_mp_data}
                                    onChange={handleChange}
                                    fullWidth
                                    multiline
                                    rows={4}
                                    InputProps={{ style: { fontSize: '0.8rem', fontFamily: 'monospace' } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
                <Button onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSave} 
                    disabled={saving || loading}
                    startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                    {purchase ? 'Atualizar' : 'Registrar Venda'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
