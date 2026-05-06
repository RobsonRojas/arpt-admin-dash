import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    MenuItem, CircularProgress, Alert, Snackbar, Grid, Autocomplete
} from '@mui/material';
import { Add, QrCode, AssignmentInd, Refresh, Download, History } from '@mui/icons-material';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const PhysicalPieces = () => {
    const { 
        properties, 
        getPhysicalPieces, 
        createPhysicalPiece, 
        attributePhysicalPiece,
        getProducts,
        getInventoriesByPropertyId,
        getTreesByInventoryId
    } = useAdmin();

    const [pieces, setPieces] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // New Piece Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [inventories, setInventories] = useState([]);
    const [selectedInventoryId, setSelectedInventoryId] = useState('');
    const [trees, setTrees] = useState([]);
    const [selectedTree, setSelectedTree] = useState(null);
    const [selectedProductId, setSelectedProductId] = useState('');

    // Attribution Dialog state
    const [openAttrDialog, setOpenAttrDialog] = useState(false);
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [userId, setUserId] = useState('');

    const fetchData = async () => {
        setLoading(true);
        const [piecesData, productsData] = await Promise.all([
            getPhysicalPieces(),
            getProducts()
        ]);
        setPieces(piecesData || []);
        setProducts(productsData?.filter(p => p.is_physical_reward) || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedPropertyId) {
            getInventoriesByPropertyId(selectedPropertyId).then(data => setInventories(data || []));
        } else {
            setInventories([]);
        }
        setSelectedInventoryId('');
    }, [selectedPropertyId]);

    useEffect(() => {
        if (selectedInventoryId) {
            getTreesByInventoryId(selectedInventoryId, 1, 1000).then(res => setTrees(res?.data?.inventories || []));
        } else {
            setTrees([]);
        }
        setSelectedTree(null);
    }, [selectedInventoryId]);

    const handleCreate = async () => {
        if (!selectedTree || !selectedProductId) {
            setSnackbar({ open: true, message: 'Selecione uma árvore e um produto', severity: 'warning' });
            return;
        }

        const res = await createPhysicalPiece({
            id_arvore: selectedTree.id,
            id_produto: selectedProductId
        });

        if (res) {
            setSnackbar({ open: true, message: 'Peça física criada com sucesso', severity: 'success' });
            setOpenDialog(false);
            fetchData();
        } else {
            setSnackbar({ open: true, message: 'Erro ao criar peça', severity: 'error' });
        }
    };

    const handleAttribute = async () => {
        if (!userId) return;
        const res = await attributePhysicalPiece(selectedPiece.id, Number(userId));
        if (res) {
            setSnackbar({ open: true, message: 'Peça atribuída com sucesso', severity: 'success' });
            setOpenAttrDialog(false);
            fetchData();
        } else {
            setSnackbar({ open: true, message: 'Erro ao atribuir peça', severity: 'error' });
        }
    };

    const downloadLabel = (pieceId) => {
        window.open(`${api.defaults.baseURL}/admin/pecas/${pieceId}/label`, '_blank');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">Gestão de Peças Físicas (Recompensas)</Typography>
                <Box display="flex" gap={2}>
                    <Button startIcon={<Refresh />} onClick={fetchData}>Atualizar</Button>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>Nova Peça</Button>
                </Box>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID / Slug</TableCell>
                                <TableCell>Produto</TableCell>
                                <TableCell>Árvore Origem</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pieces.map((piece) => (
                                <TableRow key={piece.id}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">{piece.slug}</Typography>
                                        <Typography variant="caption" color="textSecondary">{piece.id}</Typography>
                                    </TableCell>
                                    <TableCell>{products.find(p => p.id === piece.id_produto)?.nome || piece.id_produto}</TableCell>
                                    <TableCell>Árvore #{piece.id_arvore}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={piece.status} 
                                            size="small" 
                                            color={piece.status === 'PUBLIC' ? 'success' : 'primary'} 
                                        />
                                    </TableCell>
                                    <TableCell>{piece.id_usuario ? `User ID: ${piece.id_usuario}` : 'Não atribuído'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" title="Baixar Placa" onClick={() => downloadLabel(piece.id)}>
                                            <Download />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            color="primary" 
                                            title="Atribuir a Cliente"
                                            onClick={() => { setSelectedPiece(piece); setOpenAttrDialog(true); }}
                                        >
                                            <AssignmentInd />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {pieces.length === 0 && (
                                <TableRow><TableCell colSpan={6} align="center">Nenhuma peça encontrada</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create Piece Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Criar Nova Peça Física</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} pt={1}>
                        <Grid item xs={12}>
                            <TextField
                                select fullWidth label="Propriedade"
                                value={selectedPropertyId}
                                onChange={(e) => setSelectedPropertyId(e.target.value)}
                            >
                                {properties.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                select fullWidth label="Inventário"
                                value={selectedInventoryId}
                                onChange={(e) => setSelectedInventoryId(e.target.value)}
                                disabled={!selectedPropertyId}
                            >
                                {inventories.map(i => <MenuItem key={i.id} value={i.id}>Inventário {i.id}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Autocomplete
                                options={trees}
                                getOptionLabel={(option) => `Árvore #${option.number} - ${option.specieName}`}
                                renderInput={(params) => <TextField {...params} label="Árvore" />}
                                value={selectedTree}
                                onChange={(e, val) => setSelectedTree(val)}
                                disabled={!selectedInventoryId}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                select fullWidth label="Produto Recompensa"
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                            >
                                {products.map(p => <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>)}
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleCreate}>Criar Peça</Button>
                </DialogActions>
            </Dialog>

            {/* Attribution Dialog */}
            <Dialog open={openAttrDialog} onClose={() => setOpenAttrDialog(false)}>
                <DialogTitle>Atribuir Peça a Cliente</DialogTitle>
                <DialogContent>
                    <Box pt={1}>
                        <Typography variant="body2" gutterBottom>Digite o ID do usuário (cliente) que adquiriu esta peça.</Typography>
                        <TextField 
                            fullWidth label="ID do Usuário" 
                            type="number"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAttrDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleAttribute}>Atribuir</Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};
