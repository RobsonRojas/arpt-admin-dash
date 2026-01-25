import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    FormControlLabel, Switch, CircularProgress, Alert, Snackbar,
    Avatar, Grid
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Visibility, Image as ImageIcon, BrokenImage } from '@mui/icons-material';
import { api } from '../services/api';

export const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        info: '',
        preco: 0,
        prazo_entrega_meses: 0,
        is_ativo: true,
        foto_url: ''
    });

    // Image Error State for View and Preview
    const [imgError, setImgError] = useState(false);

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
                setSnackbar({ open: true, message: 'Erro ao carregar produtos', severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleOpenDialog = (product = null) => {
        setImgError(false); // Reset error state on open
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

    const handleOpenView = (product) => {
        setImgError(false); // Reset error state
        setViewingProduct(product);
        setOpenViewDialog(true);
    };

    const handleCloseView = () => {
        setOpenViewDialog(false);
        setViewingProduct(null);
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
            setSnackbar({ open: true, message: 'Erro ao salvar produto', severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja deletar este produto?')) {
            try {
                await api.delete(`/produtos/${id}`);
                fetchProducts();
            } catch (err) {
                console.error(err);
                setSnackbar({ open: true, message: 'Erro ao deletar produto', severity: 'error' });
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
                                <TableCell>Produto</TableCell>
                                <TableCell>Preço</TableCell>
                                <TableCell>Prazo (meses)</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar
                                                src={row.fotos?.[0]?.url}
                                                variant="rounded"
                                                sx={{ width: 48, height: 48 }}
                                            >
                                                <ImageIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography fontWeight="bold">{row.nome}</Typography>
                                                <Typography variant="caption" color="textSecondary">{row.info}</Typography>
                                            </Box>
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
                                        <IconButton size="small" color="primary" onClick={() => handleOpenView(row)}>
                                            <Visibility />
                                        </IconButton>
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

            {/* Create/Edit Dialog */}
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
                            onChange={(e) => {
                                setFormData({ ...formData, foto_url: e.target.value });
                                setImgError(false); // Reset error on change
                            }}
                            helperText="URL direta para a imagem do produto"
                        />

                        {/* Image Preview */}
                        {formData.foto_url && !imgError ? (
                            <Box
                                display="flex"
                                justifyContent="center"
                                p={1}
                                border="1px dashed #ccc"
                                borderRadius={1}
                                bgcolor="grey.50"
                            >
                                <img
                                    src={formData.foto_url}
                                    alt="Preview"
                                    style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                                    onError={() => setImgError(true)}
                                />
                            </Box>
                        ) : formData.foto_url && imgError && (
                            <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                color="error.main"
                                bgcolor="error.light"
                                p={1}
                                borderRadius={1}
                            >
                                <BrokenImage fontSize="small" />
                                <Typography variant="caption">Não foi possível carregar a imagem</Typography>
                            </Box>
                        )}

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

            {/* View Dialog */}
            <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {viewingProduct?.nome}
                </DialogTitle>
                <DialogContent dividers>
                    {viewingProduct && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} display="flex" justifyContent="center">
                                {viewingProduct.fotos?.[0]?.url && !imgError ? (
                                    <Box
                                        component="img"
                                        src={viewingProduct.fotos[0].url}
                                        alt={viewingProduct.nome}
                                        onError={() => setImgError(true)}
                                        sx={{
                                            maxWidth: '100%',
                                            maxHeight: 300,
                                            borderRadius: 1,
                                            objectFit: 'contain'
                                        }}
                                    />
                                ) : (
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        flexDirection="column"
                                        sx={{
                                            width: '100%',
                                            height: 200,
                                            bgcolor: 'grey.100',
                                            borderRadius: 1
                                        }}
                                    >
                                        {viewingProduct.fotos?.[0]?.url ? (
                                            <BrokenImage sx={{ fontSize: 60, color: 'grey.300', mb: 1 }} />
                                        ) : (
                                            <ImageIcon sx={{ fontSize: 60, color: 'grey.300' }} />
                                        )}
                                        <Typography variant="caption" color="textSecondary">
                                            {viewingProduct.fotos?.[0]?.url ? "Erro ao carregar imagem" : "Sem foto"}
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="textSecondary">Descrição</Typography>
                                <Typography variant="body1" paragraph>
                                    {viewingProduct.info || "Sem descrição."}
                                </Typography>

                                <Box display="flex" justifyContent="space-between" mt={2}>
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Preço</Typography>
                                        <Typography variant="h6" color="primary">R$ {viewingProduct.preco}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Prazo</Typography>
                                        <Typography variant="body1">{viewingProduct.prazo_entrega_meses} meses</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                                        <Chip
                                            label={viewingProduct.is_ativo ? "Ativo" : "Inativo"}
                                            color={viewingProduct.is_ativo ? "success" : "default"}
                                            size="small"
                                        />
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseView}>Fechar</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            handleCloseView();
                            handleOpenDialog(viewingProduct);
                        }}
                    >
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box >
    );
};
