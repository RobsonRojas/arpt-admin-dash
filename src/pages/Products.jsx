import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    FormControlLabel, Switch, CircularProgress, Alert
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { api } from '../services/api';

export const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        info: '',
        preco: 0,
        prazo_entrega_meses: 0,
        is_ativo: true,
        foto_url: ''
    });

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/produtos');
            // The backend returns an array of products
            setProducts(Array.isArray(response.data) ? response.data : [response.data]);
            setError(null);
        } catch (err) {
            // If it returns empty object when empty
            if (err.response?.data && Object.keys(err.response.data).length === 0) {
                setProducts([]);
            } else {
                console.error(err);
                setError('Erro ao carregar produtos');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleOpenDialog = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                nome: product.nome,
                info: product.info,
                preco: product.preco,
                prazo_entrega_meses: product.prazo_entrega_meses,
                is_ativo: product.is_ativo,
                foto_url: product.fotos?.[0]?.url || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                nome: '',
                info: '',
                preco: 0,
                prazo_entrega_meses: 0,
                is_ativo: true,
                foto_url: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingProduct(null);
    };

    const handleSave = async () => {
        try {
            const payload = {
                nome: formData.nome,
                info: formData.info,
                preco: Number(formData.preco),
                prazo_entrega_meses: Number(formData.prazo_entrega_meses),
                is_ativo: formData.is_ativo,
                fotos: formData.foto_url ? [{ url: formData.foto_url, alt: formData.nome, type: 'principal' }] : []
            };

            if (editingProduct) {
                await api.put(`/produtos/${editingProduct.id}`, payload);
            } else {
                await api.post('/produtos', payload);
            }

            handleCloseDialog();
            fetchProducts();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar produto');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja deletar este produto?')) {
            try {
                await api.delete(`/produtos/${id}`);
                fetchProducts();
            } catch (err) {
                console.error(err);
                alert('Erro ao deletar produto');
            }
        }
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s', p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight={600}>
                    Gestão de Produtos
                </Typography>
                <Box display="flex" gap={2}>
                    <Button onClick={fetchProducts} startIcon={<Refresh />}>
                        Atualizar
                    </Button>
                    <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                        Novo Produto
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f9fafb' }}>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nome</TableCell>
                                <TableCell>Preço</TableCell>
                                <TableCell>Prazo (meses)</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>{row.id}</TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography fontWeight="bold">{row.nome}</Typography>
                                            <Typography variant="caption" color="textSecondary">{row.info}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>R$ {row.preco}</TableCell>
                                    <TableCell>{row.prazo_entrega_meses}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.is_ativo ? "Ativo" : "Inativo"}
                                            color={row.is_ativo ? "success" : "default"}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleOpenDialog(row)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {products.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">Nenhum produto encontrado</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                <DialogContent dividers>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Nome do Produto"
                            fullWidth
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        />
                        <TextField
                            label="Informações/Descrição"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.info}
                            onChange={(e) => setFormData({ ...formData, info: e.target.value })}
                        />
                        <Box display="flex" gap={2}>
                            <TextField
                                label="Preço"
                                type="number"
                                fullWidth
                                value={formData.preco}
                                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                            />
                            <TextField
                                label="Prazo de Entrega (meses)"
                                type="number"
                                fullWidth
                                value={formData.prazo_entrega_meses}
                                onChange={(e) => setFormData({ ...formData, prazo_entrega_meses: e.target.value })}
                            />
                        </Box>
                        <TextField
                            label="URL da Foto"
                            fullWidth
                            value={formData.foto_url}
                            onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                            helperText="URL direta para a imagem do produto"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_ativo}
                                    onChange={(e) => setFormData({ ...formData, is_ativo: e.target.checked })}
                                />
                            }
                            label="Produto Ativo"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave}>Salvar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
