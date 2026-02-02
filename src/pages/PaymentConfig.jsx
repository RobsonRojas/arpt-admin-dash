import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Tabs, Tab, TextField, Button, Switch, FormControlLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Grid, Chip
} from '@mui/material';
import { Edit, Delete, Add, ContentCopy } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const PaymentConfig = () => {
    const [tabValue, setTabValue] = useState(0);
    const [config, setConfig] = useState({ enabled: true, fee_percentage: 10, description: '' });
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
    const [currentSeller, setCurrentSeller] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const { user } = useAuth();

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/pagamentos/admin/payment-config');
            if (res.data) setConfig(res.data);
        } catch (error) {
            console.error('Error fetching config:', error);
            setSnackbar({ open: true, message: 'Erro ao carregar configurações', severity: 'error' });
        }
    };

    const fetchSellers = async () => {
        try {
            const res = await api.get('/pagamentos/admin/sellers');
            if (res.data) setSellers(res.data);
        } catch (error) {
            console.error('Error fetching sellers:', error);
            setSnackbar({ open: true, message: 'Erro ao carregar vendedores', severity: 'error' });
        }
    };

    useEffect(() => {
        fetchConfig();
        if (tabValue === 1) {
            fetchSellers();
        }
    }, [tabValue]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleConfigSave = async () => {
        setLoading(true);
        try {
            await api.put('/pagamentos/admin/payment-config', {
                enabled: config.enabled,
                fee_percentage: Number(config.fee_percentage),
                description: config.description
            });
            setSnackbar({ open: true, message: 'Configurações salvas', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Erro ao salvar configurações', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSellerSave = async (sellerData) => {
        try {
            if (currentSeller) {
                await api.put(`/pagamentos/admin/sellers/${currentSeller.seller_id}`, sellerData);
                setSnackbar({ open: true, message: 'Vendedor atualizado', severity: 'success' });
            } else {
                await api.post('/pagamentos/admin/sellers', sellerData);
                setSnackbar({ open: true, message: 'Vendedor criado', severity: 'success' });
            }
            setSellerDialogOpen(false);
            fetchSellers();
        } catch (error) {
            setSnackbar({ open: true, message: 'Erro ao salvar vendedor', severity: 'error' });
        }
    };

    const handleSellerDelete = async (sellerId) => {
        if (!window.confirm('Tem certeza que deseja desativar este vendedor?')) return;
        try {
            await api.delete(`/pagamentos/admin/sellers/${sellerId}`);
            setSnackbar({ open: true, message: 'Vendedor desativado', severity: 'success' });
            fetchSellers();
        } catch (error) {
            setSnackbar({ open: true, message: 'Erro ao desativar vendedor', severity: 'error' });
        }
    };

    // Pagination handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };


    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Configurações de Pagamento</Typography>
            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
                    <Tab label="Geral" />
                    <Tab label="Vendedores (Split)" />
                </Tabs>
            </Paper>

            {tabValue === 0 && (
                <Paper sx={{ p: 3, maxWidth: 600 }}>
                    <Typography variant="h6" gutterBottom>Taxa de Marketplace</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                            control={<Switch checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />}
                            label={config.enabled ? "Cobrança de Taxa Ativa" : "Cobrança de Taxa Inativa"}
                        />
                        <TextField
                            label="Porcentagem da Taxa (%)"
                            type="number"
                            value={config.fee_percentage}
                            onChange={(e) => setConfig({ ...config, fee_percentage: e.target.value })}
                            disabled={!config.enabled}
                            inputProps={{ step: "0.01" }}
                        />
                        <TextField
                            label="Descrição"
                            multiline
                            rows={3}
                            value={config.description}
                            onChange={(e) => setConfig({ ...config, description: e.target.value })}
                        />
                        <Button variant="contained" onClick={handleConfigSave} disabled={loading}>
                            Salvar Alterações
                        </Button>
                    </Box>
                </Paper>
            )}

            {tabValue === 1 && (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Vendedores Cadastrados</Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setCurrentSeller(null); setSellerDialogOpen(true); }}>
                            Novo Vendedor
                        </Button>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID Vendedor</TableCell>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Collector ID (MP)</TableCell>
                                    <TableCell>Chave PIX</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sellers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((seller) => (
                                    <TableRow key={seller.id}>
                                        <TableCell>{seller.seller_id}</TableCell>
                                        <TableCell>{seller.seller_name}</TableCell>
                                        <TableCell>{seller.seller_email}</TableCell>
                                        <TableCell>
                                            {seller.mercado_pago_collector_id && (
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {seller.mercado_pago_collector_id}
                                                    <IconButton size="small" onClick={() => navigator.clipboard.writeText(seller.mercado_pago_collector_id)}>
                                                        <ContentCopy fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell>{seller.pix_key}</TableCell>
                                        <TableCell>
                                            <Chip label={seller.active ? "Ativo" : "Inativo"} color={seller.active ? "success" : "default"} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => { setCurrentSeller(seller); setSellerDialogOpen(true); }}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => handleSellerDelete(seller.seller_id)}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={sellers.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}

            <SellerDialog
                open={sellerDialogOpen}
                onClose={() => setSellerDialogOpen(false)}
                seller={currentSeller}
                onSave={handleSellerSave}
            />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

const SellerDialog = ({ open, onClose, seller, onSave }) => {
    const [formData, setFormData] = useState({
        seller_id: '', seller_name: '', seller_email: '', mercado_pago_collector_id: '', pix_key: ''
    });

    useEffect(() => {
        if (seller) {
            setFormData(seller);
        } else {
            setFormData({ seller_id: '', seller_name: '', seller_email: '', mercado_pago_collector_id: '', pix_key: '' });
        }
    }, [seller]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{seller ? 'Editar Vendedor' : 'Novo Vendedor'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        name="seller_id" label="ID Vendedor (Único)" value={formData.seller_id} onChange={handleChange} fullWidth required disabled={!!seller}
                    />
                    <TextField
                        name="seller_name" label="Nome" value={formData.seller_name} onChange={handleChange} fullWidth required
                    />
                    <TextField
                        name="seller_email" label="Email" value={formData.seller_email} onChange={handleChange} fullWidth required
                    />
                    <TextField
                        name="mercado_pago_collector_id" label="Mercado Pago Collector ID" value={formData.mercado_pago_collector_id || ''} onChange={handleChange} fullWidth
                        helperText="ID do usuário no Mercado Pago que receberá o split"
                    />
                    <TextField
                        name="pix_key" label="Chave PIX" value={formData.pix_key || ''} onChange={handleChange} fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={() => onSave(formData)} variant="contained">Salvar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentConfig;
