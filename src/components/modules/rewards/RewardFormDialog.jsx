import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Grid,
    TextField, MenuItem, Button, Paper, Typography
} from '@mui/material';

export const RewardFormDialog = ({
    open,
    onClose,
    isEditing,
    formData,
    setFormData,
    products,
    handleSave,
    loading
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {isEditing ? 'Editar Recompensa' : 'Nova Recompensa'}
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} pt={1}>
                    <Grid item xs={12}>
                        <TextField
                            select
                            fullWidth
                            label="Selecione o Produto *"
                            value={formData.id_produto}
                            onChange={e => {
                                const prod = products.find(p => p.id === e.target.value);
                                setFormData({
                                    ...formData,
                                    id_produto: e.target.value,
                                    qtd_products: prod?.qtd_disponivel || 0
                                });
                            }}
                        >
                            {products.map((product) => (
                                <MenuItem key={product.id} value={product.id}>
                                    {product.nome} (R$ {product.preco?.toLocaleString('pt-BR')})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    {formData.id_produto && (
                        <>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="subtitle2" color="primary">Dados do Produto Selecionado:</Typography>
                                    <Typography variant="body2"><strong>Nome:</strong> {products.find(p => p.id === formData.id_produto)?.nome}</Typography>
                                    <Typography variant="body2"><strong>Info:</strong> {products.find(p => p.id === formData.id_produto)?.info}</Typography>
                                    <Typography variant="body2"><strong>Preço Varejo:</strong> R$ {products.find(p => p.id === formData.id_produto)?.preco?.toLocaleString('pt-BR')}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Preço Recompensa *"
                                    value={formData.reward_price}
                                    onChange={e => setFormData({ ...formData, reward_price: e.target.value })}
                                    inputProps={{ step: '0.01', min: '0' }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Quantidade Disponível *"
                                    value={formData.reward_qtd}
                                    onChange={e => setFormData({ ...formData, reward_qtd: e.target.value })}
                                    inputProps={{ min: '0' }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Unidades de Produto *"
                                    value={formData.qtd_products}
                                    onChange={e => setFormData({ ...formData, qtd_products: e.target.value })}
                                    inputProps={{ min: '1' }}
                                    helperText="Qtde. de produtos nesta recompensa"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Data de Entrega *"
                                    value={formData.delivery ? (typeof formData.delivery === 'string' ? formData.delivery.split('T')[0] : new Date(formData.delivery).toISOString().split('T')[0]) : ''}
                                    onChange={e => setFormData({ ...formData, delivery: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
                <Button onClick={onClose} disabled={loading} fullWidth={{ xs: true, sm: false }}>
                    Cancelar
                </Button>
                <Button 
                    variant="contained" 
                    onClick={handleSave} 
                    disabled={loading}
                    fullWidth={{ xs: true, sm: false }}
                >
                    {isEditing ? 'Atualizar' : 'Cadastrar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
