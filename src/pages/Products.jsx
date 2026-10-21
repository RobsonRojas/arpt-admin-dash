import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    FormControlLabel, Switch, CircularProgress, Alert, Snackbar,
    Avatar, Grid, useMediaQuery, useTheme, MenuItem
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Close, Image as ImageIcon, Search, Refresh, BrokenImage } from '@mui/icons-material';
import { AIAssistant } from '../components/AIAssistant';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';
import { recordAudit } from '../services/auditLog';
import { buildShippingPayload } from '../utils/shipping';
import { api } from '../services/api';
import { usePersistence } from '../hooks/usePersistence';
import { MODOS, OFFER_DEFAULTS, buildOfferPayload, leadTimeLabel, modoLabel, offerFormFromProduct } from '../utils/offer';

export const Products = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
    // Form state with Persistence
    const [persistenceKey, setPersistenceKey] = useState('product_draft_new');
    const [formData, setFormData, clearDraft] = usePersistence(persistenceKey, {
        nome: '',
        nome_en: '',
        info: '',
        info_en: '',
        preco: 0,
        ...OFFER_DEFAULTS,
        is_ativo: true,
        is_physical_reward: false,
        carbon_stored_kg: 0,
        weight_grams: 0,
        width_cm: 0,
        height_cm: 0,
        length_cm: 0,
        cep_origem: '',
        foto_url: '',
        translations: {}
    });

    // Image Error State for View and Preview
    const [imgError, setImgError] = useState(false);

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

        let initialData;
        let key;

        if (product) {
            setEditingProduct(product);
            key = `product_draft_${product.id}`;
            initialData = {
                nome: product.nome,
                nome_en: product.nome_en || '',
                info: product.info,
                info_en: product.info_en || '',
                preco: product.preco,
                ...offerFormFromProduct(product),
                is_ativo: product.is_ativo,
                is_physical_reward: product.is_physical_reward || false,
                carbon_stored_kg: product.carbon_stored_kg || 0,
                weight_grams: product.weight_grams || 0,
                width_cm: product.width_cm || 0,
                height_cm: product.height_cm || 0,
                length_cm: product.length_cm || 0,
                cep_origem: product.cep_origem || '',
                foto_url: product.fotos?.[0]?.url || '',
                translations: product.translations || {}
            };
            // Map translations to local fields
            if (product.translations && product.translations.en) {
                initialData.nome_en = product.translations.en.nome || '';
                initialData.info_en = product.translations.en.info || '';
            }
        } else {
            setEditingProduct(null);
            key = 'product_draft_new';
            initialData = {
                nome: '',
                nome_en: '',
                info: '',
                info_en: '',
                preco: 0,
                ...OFFER_DEFAULTS,
                is_ativo: true,
                is_physical_reward: false,
                carbon_stored_kg: 0,
                weight_grams: 0,
                width_cm: 0,
                height_cm: 0,
                length_cm: 0,
                cep_origem: '',
                foto_url: '',
                translations: {}
            };
        }

        setPersistenceKey(key);
        // We set the initial data immediately. 
        // If a draft exists, the usePersistence hook will overwrite this state asynchronously.
        setFormData(initialData);
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
        if (!formData.nome || formData.nome.length < 10) {
            setSnackbar({ open: true, message: 'O nome do produto deve ter pelo menos 10 caracteres', severity: 'warning' });
            return;
        }

        // Prazos e estoque são validados aqui como no servidor (o servidor continua sendo a fonte da verdade).
        const offer = buildOfferPayload(formData);
        if (offer.error) {
            setSnackbar({ open: true, message: offer.error, severity: 'warning' });
            return;
        }
        // Peso, medidas e CEP de origem: validados aqui como no servidor (inteiros, com teto; CEP de 8 dígitos).
        const shipping = buildShippingPayload(formData);
        if (shipping.error) {
            setSnackbar({ open: true, message: shipping.error, severity: 'warning' });
            return;
        }

        try {
            const payload = {
                nome: formData.nome,
                nome_en: formData.nome_en,
                info: formData.info,
                info_en: formData.info_en,
                preco: Number(formData.preco),
                ...offer.payload,
                is_ativo: formData.is_ativo,
                is_physical_reward: formData.is_physical_reward,
                carbon_stored_kg: Number(formData.carbon_stored_kg),
                ...shipping.payload,
                translations: {
                    ...(formData.translations || {}),
                    en: {
                        nome: formData.nome_en,
                        info: formData.info_en
                    }
                },
                fotos: formData.foto_url ? [{ src: formData.foto_url, alt: formData.nome.padEnd(10, '_'), type: 'principal' }] : []
            };

            const token = await user.getIdToken();
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (editingProduct) {
                await api.put(`/produtos/${editingProduct.id}`, payload, config);
                await recordAudit({
                    action: 'UPDATE',
                    entity: 'PRODUCT',
                    entityId: String(editingProduct.id),
                    before: editingProduct,
                    after: { ...payload, id: editingProduct.id },
                    user
                });
                if (payload.is_physical_reward) {
                    setSnackbar({ open: true, message: 'Produto atualizado e geração de recompensa física ativada com sucesso!', severity: 'success' });
                } else {
                    setSnackbar({ open: true, message: 'Produto atualizado com sucesso!', severity: 'success' });
                }
            } else {
                const response = await api.post('/produtos', payload, config);
                await recordAudit({
                    action: 'CREATE',
                    entity: 'PRODUCT',
                    entityId: String(response.data?.id || 'new'),
                    before: null,
                    after: payload,
                    user
                });
                if (payload.is_physical_reward) {
                    setSnackbar({ open: true, message: 'Produto criado e geração de recompensa física ativada com sucesso!', severity: 'success' });
                } else {
                    setSnackbar({ open: true, message: 'Produto criado com sucesso!', severity: 'success' });
                }
            }

            await clearDraft(); // Clear draft on success
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
                const before = products.find(p => p.id === id);
                const token = await user.getIdToken();
                await api.delete(`/produtos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                await recordAudit({
                    action: 'DELETE',
                    entity: 'PRODUCT',
                    entityId: String(id),
                    before,
                    after: null,
                    user
                });
                fetchProducts();
            } catch (err) {
                console.error(err);
                setSnackbar({ open: true, message: 'Erro ao deletar produto', severity: 'error' });
            }
        }
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s', p: 3 }}>
            <a href="#main-content" onClick={handleSkip} ref={skipRef} style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>Skip to main content</a>
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
                <>
                    {/* Desktop Table View */}
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', display: { xs: 'none', md: 'block' } }} id="main-content">
                        <Table>
                            <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                <TableRow>
                                    <TableCell>Produto</TableCell>
                                    <TableCell>Preço</TableCell>
                                    <TableCell>Oferta e prazo</TableCell>
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
                                        <TableCell>
                                            <Chip size="small" label={modoLabel(row.modo_oferta)} color={row.modo_oferta === 'PRONTA_ENTREGA' ? 'success' : 'default'} />
                                            <Typography variant="body2" color="textSecondary">{leadTimeLabel(row)}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={row.is_ativo ? "Ativo" : "Inativo"}
                                                color={row.is_ativo ? "success" : "default"}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" color="primary" onClick={() => handleOpenView(row)} aria-label="Visualizar Produto">
                                                <Visibility />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleOpenDialog(row)} aria-label="Editar Produto">
                                                <Edit />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(row.id)} aria-label="Deletar Produto">
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

                    {/* Mobile Card View */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                        {products.map((row) => (
                            <Paper key={row.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box display="flex" gap={2} alignItems="center">
                                    <Avatar
                                        src={row.fotos?.[0]?.url}
                                        variant="rounded"
                                        sx={{ width: 60, height: 60 }}
                                    >
                                        <ImageIcon />
                                    </Avatar>
                                    <Box flex={1}>
                                        <Typography fontWeight="bold" variant="subtitle1">{row.nome}</Typography>
                                        <Typography variant="body2" color="textSecondary" noWrap>{row.info}</Typography>
                                    </Box>
                                    <IconButton size="small" onClick={(e) => {
                                        // Simple menu or just actions row
                                    }}>
                                        {/* Could use MoreVert here, but let's just show actions below or inline */}
                                    </IconButton>
                                </Box>

                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2"><strong>Preço:</strong> R$ {row.preco}</Typography>
                                    <Chip
                                        label={row.is_ativo ? "Ativo" : "Inativo"}
                                        color={row.is_ativo ? "success" : "default"}
                                        size="small"
                                    />
                                </Box>

                                <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                                    <Button size="small" startIcon={<Visibility />} onClick={() => handleOpenView(row)}>
                                        Ver
                                    </Button>
                                    <Button size="small" startIcon={<Edit />} onClick={() => handleOpenDialog(row)}>
                                        Editar
                                    </Button>
                                    <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(row.id)}>
                                        Excluir
                                    </Button>
                                </Box>
                            </Paper>
                        ))}
                        {products.length === 0 && (
                            <Typography align="center" color="textSecondary">Nenhum produto encontrado</Typography>
                        )}
                    </Box>
                </>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
                <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                <DialogContent dividers>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Nome do Produto (PT)"
                            fullWidth
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        />
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="caption">Nome do Produto (EN)</Typography>
                                <AIAssistant
                                    initialText={formData.nome_en}
                                    sourceText={formData.nome}
                                    context={`Product: ${formData.nome}`}
                                    onApply={(text) => setFormData({ ...formData, nome_en: text })}
                                    label="Traduzir Nome EN"
                                />
                            </Box>
                            <TextField
                                fullWidth
                                value={formData.nome_en}
                                onChange={(e) => setFormData({ ...formData, nome_en: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="caption">Descrição / Informações (PT)</Typography>
                                <AIAssistant
                                    initialText={formData.info}
                                    context={`Produto: ${formData.nome}`}
                                    onApply={(text) => setFormData({ ...formData, info: text })}
                                    label="Melhorar Descrição PT"
                                />
                            </Box>
                            <TextField
                                fullWidth
                                label="Informações Adicionais (PT)"
                                multiline
                                rows={3}
                                value={formData.info}
                                onChange={(e) => setFormData({ ...formData, info: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="caption">Descrição / Informações (EN)</Typography>
                                <AIAssistant
                                    initialText={formData.info_en}
                                    sourceText={formData.info}
                                    context={`Product: ${formData.nome_en || formData.nome}`}
                                    onApply={(text) => setFormData({ ...formData, info_en: text })}
                                    label="Improve Description EN"
                                />
                            </Box>
                            <TextField
                                fullWidth
                                label="Additional Info (EN)"
                                multiline
                                rows={3}
                                value={formData.info_en}
                                onChange={(e) => setFormData({ ...formData, info_en: e.target.value })}
                            />
                        </Grid>
                        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                            <TextField
                                label="Preço"
                                type="number"
                                fullWidth
                                value={formData.preco}
                                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                            />
                            <TextField
                                select
                                label="Modo de oferta"
                                fullWidth
                                value={formData.modo_oferta || 'ENCOMENDA'}
                                onChange={(e) => setFormData({ ...formData, modo_oferta: e.target.value })}
                                helperText="Pronta entrega tem estoque; encomenda é produzida sob pedido."
                            >
                                {Object.entries(MODOS).map(([value, label]) => (
                                    <MenuItem key={value} value={value}>{label}</MenuItem>
                                ))}
                            </TextField>
                            {(formData.modo_oferta || 'ENCOMENDA') === 'PRONTA_ENTREGA' ? (
                                <TextField
                                    label="Estoque (unidades)"
                                    type="number"
                                    fullWidth
                                    required
                                    inputProps={{ min: 0, step: 1 }}
                                    value={formData.estoque ?? ''}
                                    onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                                />
                            ) : (
                                <Box display="flex" gap={2}>
                                    <TextField
                                        label="Produção mínima (dias)"
                                        type="number"
                                        fullWidth
                                        required
                                        inputProps={{ min: 0, step: 1 }}
                                        value={formData.prazo_producao_dias_min ?? ''}
                                        onChange={(e) => setFormData({ ...formData, prazo_producao_dias_min: e.target.value })}
                                    />
                                    <TextField
                                        label="Produção máxima (dias)"
                                        type="number"
                                        fullWidth
                                        required
                                        inputProps={{ min: 0, step: 1 }}
                                        value={formData.prazo_producao_dias_max ?? ''}
                                        onChange={(e) => setFormData({ ...formData, prazo_producao_dias_max: e.target.value })}
                                    />
                                </Box>
                            )}
                            <TextField
                                label="Prazo de despacho (dias)"
                                type="number"
                                fullWidth
                                required={(formData.modo_oferta || 'ENCOMENDA') === 'PRONTA_ENTREGA'}
                                inputProps={{ min: 0, step: 1 }}
                                value={formData.prazo_despacho_dias ?? ''}
                                onChange={(e) => setFormData({ ...formData, prazo_despacho_dias: e.target.value })}
                                helperText="O frete é somado pelo servidor na cotação."
                            />
                            <Box display="flex" gap={2}>
                                <TextField
                                    label="Capacidade semanal (opcional)"
                                    type="number"
                                    fullWidth
                                    inputProps={{ min: 0, step: 1 }}
                                    value={formData.capacidade_semanal ?? ''}
                                    onChange={(e) => setFormData({ ...formData, capacidade_semanal: e.target.value })}
                                />
                                {(formData.modo_oferta || 'ENCOMENDA') === 'ENCOMENDA' && (
                                    <TextField
                                        label="Limite da fila (opcional)"
                                        type="number"
                                        fullWidth
                                        inputProps={{ min: 0, step: 1 }}
                                        value={formData.limite_fila ?? ''}
                                        onChange={(e) => setFormData({ ...formData, limite_fila: e.target.value })}
                                        helperText="Sem limite, a fila nunca enche."
                                    />
                                )}
                            </Box>
                            <TextField
                                label="Carbono Estocado (kg)"
                                type="number"
                                fullWidth
                                value={formData.carbon_stored_kg}
                                onChange={(e) => setFormData({ ...formData, carbon_stored_kg: e.target.value })}
                                helperText="Estimativa de carbono para este produto"
                            />
                        </Box>
                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>Dimensões e Peso (Opcional - usado para frete)</Typography>
                        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                            <TextField
                                label="Peso (g)"
                                type="number"
                                fullWidth
                                value={formData.weight_grams}
                                onChange={(e) => setFormData({ ...formData, weight_grams: e.target.value })}
                            />
                            <TextField
                                label="Largura (cm)"
                                type="number"
                                fullWidth
                                value={formData.width_cm}
                                onChange={(e) => setFormData({ ...formData, width_cm: e.target.value })}
                            />
                            <TextField
                                label="Altura (cm)"
                                type="number"
                                fullWidth
                                value={formData.height_cm}
                                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                            />
                            <TextField
                                label="Profundidade (cm)"
                                type="number"
                                fullWidth
                                value={formData.length_cm}
                                onChange={(e) => setFormData({ ...formData, length_cm: e.target.value })}
                            />
                        </Box>
                        <TextField
                            label="CEP de origem do envio"
                            fullWidth
                            placeholder="69000-000"
                            helperText="De onde este produto é despachado. Sem peso, medidas e CEP de origem o produto não é vendido com frete."
                            value={formData.cep_origem ?? ''}
                            onChange={(e) => setFormData({ ...formData, cep_origem: e.target.value })}
                            inputProps={{ inputMode: 'numeric' }}
                        />
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
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_physical_reward}
                                    onChange={(e) => setFormData({ ...formData, is_physical_reward: e.target.checked })}
                                />
                            }
                            label="Gera Recompensa Física (Placa Metálica)"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Button onClick={handleCloseDialog} fullWidth={{ xs: true, sm: false }}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave} fullWidth={{ xs: true, sm: false }}>Salvar</Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="sm" fullWidth fullScreen={isMobile}>
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
                                <Typography variant="subtitle2" color="textSecondary">Descrição (PT)</Typography>
                                <Typography variant="body1" paragraph>
                                    {viewingProduct.info || "Sem descrição."}
                                </Typography>

                                <Typography variant="subtitle2" color="textSecondary">Descrição (EN)</Typography>
                                <Typography variant="body1" paragraph>
                                    {viewingProduct.translations?.en?.info || viewingProduct.info_en || "No description available."}
                                </Typography>

                                <Box display="flex" justifyContent="space-between" mt={2}>
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Preço</Typography>
                                        <Typography variant="h6" color="primary">R$ {viewingProduct.preco}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Oferta e prazo</Typography>
                                        <Typography variant="body1">{modoLabel(viewingProduct.modo_oferta)} · {leadTimeLabel(viewingProduct)}</Typography>
                                        {viewingProduct.modo_oferta === 'PRONTA_ENTREGA' && (
                                            <Typography variant="body2" color="textSecondary">Estoque: {viewingProduct.estoque ?? 0}</Typography>
                                        )}
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                                        <Chip
                                            label={viewingProduct.is_ativo ? "Ativo" : "Inativo"}
                                            color={viewingProduct.is_ativo ? "success" : "default"}
                                            size="small"
                                        />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Carbono</Typography>
                                        <Typography variant="body1">{viewingProduct.carbon_stored_kg || 0} kg</Typography>
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
