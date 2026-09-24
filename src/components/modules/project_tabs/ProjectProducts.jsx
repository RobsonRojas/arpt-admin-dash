import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, ShoppingBag } from '@mui/icons-material';
import { useAdmin } from '../../../contexts/AdminContext';

export const ProjectProducts = ({ projectId }) => {
    const { getRewardsByManejoId, createReward, updateReward, deleteReward } = useAdmin();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        valor_pontos: '',
        quantidade_disponivel: ''
    });

    useEffect(() => {
        if (projectId) {
            fetchProducts();
        }
    }, [projectId]);

    const fetchProducts = async () => {
        setLoading(true);
        const data = await getRewardsByManejoId(projectId);
        if (data) {
            setProducts(data);
        }
        setLoading(false);
    };

    const handleOpenDialog = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                nome: product.nome || '',
                descricao: product.descricao || '',
                valor_pontos: product.valor_pontos || '',
                quantidade_disponivel: product.quantidade_disponivel || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                nome: '',
                descricao: '',
                valor_pontos: '',
                quantidade_disponivel: ''
            });
        }
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!formData.nome || !formData.valor_pontos) {
            alert('Nome e Valor são obrigatórios');
            return;
        }

        const payload = {
            ...formData,
            valor_pontos: Number(formData.valor_pontos),
            quantidade_disponivel: Number(formData.quantidade_disponivel || 0)
        };

        let success;
        if (editingProduct) {
            success = await updateReward(projectId, editingProduct.id, payload);
        } else {
            success = await createReward(projectId, payload);
        }

        if (success) {
            fetchProducts();
            setOpenDialog(false);
        } else {
            alert('Erro ao salvar produto');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            const success = await deleteReward(projectId, id);
            if (success) {
                fetchProducts();
            } else {
                alert('Erro ao excluir produto');
            }
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Produtos do Manejo</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                    Novo Produto
                </Button>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                </Box>
            ) : products.length === 0 ? (
                <Typography color="textSecondary" align="center">Nenhum produto cadastrado.</Typography>
            ) : (
                <>
                    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>Descrição</TableCell>
                                    <TableCell>Pontos</TableCell>
                                    <TableCell>Qtd</TableCell>
                                    <TableCell align="right">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {products.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.nome}</TableCell>
                                        <TableCell>{p.descricao}</TableCell>
                                        <TableCell>{p.valor_pontos}</TableCell>
                                        <TableCell>{p.quantidade_disponivel}</TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => handleOpenDialog(p)}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Mobile Card View */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                        {products.map((p) => (
                            <Paper key={p.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography fontWeight="bold" variant="subtitle1">{p.nome}</Typography>
                                <Typography variant="body2" color="textSecondary">{p.descricao}</Typography>
                                <Box display="flex" justifyContent="space-between" mt={1}>
                                    <Typography variant="body2"><strong>Pontos:</strong> {p.valor_pontos}</Typography>
                                    <Typography variant="body2"><strong>Qtd:</strong> {p.quantidade_disponivel}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                                    <Button size="small" startIcon={<Edit />} onClick={() => handleOpenDialog(p)}>
                                        Editar
                                    </Button>
                                    <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(p.id)}>
                                        Excluir
                                    </Button>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                </>
            )}

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} pt={1}>
                        <TextField
                            label="Nome"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Descrição"
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            fullWidth
                            multiline
                            rows={2}
                        />
                        <TextField
                            label="Valor (Pontos)"
                            type="number"
                            value={formData.valor_pontos}
                            onChange={(e) => setFormData({ ...formData, valor_pontos: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Quantidade Disponível"
                            type="number"
                            value={formData.quantidade_disponivel}
                            onChange={(e) => setFormData({ ...formData, quantidade_disponivel: e.target.value })}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Button onClick={() => setOpenDialog(false)} fullWidth={{ xs: true, sm: false }}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave} fullWidth={{ xs: true, sm: false }}>Salvar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
