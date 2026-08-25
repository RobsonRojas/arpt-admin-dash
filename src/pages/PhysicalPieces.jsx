import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    MenuItem, CircularProgress, Alert, Snackbar, Grid, Autocomplete,
    Checkbox
} from '@mui/material';
import { Add, QrCode, AssignmentInd, Refresh, Download, History, PictureAsPdf, Delete } from '@mui/icons-material';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
export const PhysicalPieces = () => {
    const { 
        properties, 
        getPhysicalPieces, 
        createPhysicalPiece, 
        attributePhysicalPiece,
        associateTagToPhysicalPiece,
        disassociateTagFromPhysicalPiece,
        getProducts,
        getInventoriesByPropertyId,
        getTreesByInventoryId,
        getUsers
    } = useAdmin();

    const [pieces, setPieces] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [downloadingBulk, setDownloadingBulk] = useState(false);
    const [downloadingLabel, setDownloadingLabel] = useState({});

    // New Piece Dialog state
    // ... (rest of state)
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
    const [users, setUsers] = useState([]);
    const [selectedUserForAttr, setSelectedUserForAttr] = useState(null);

    // Tag Association state
    const [openTagDialog, setOpenTagDialog] = useState(false);
    const [tagValue, setTagValue] = useState('');
    const [tagPropertyId, setTagPropertyId] = useState('');
    const [tagInventories, setTagInventories] = useState([]);
    const [tagInventoryId, setTagInventoryId] = useState('');
    const [tagTrees, setTagTrees] = useState([]);
    const [tagSourceTree, setTagSourceTree] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        const [piecesData, productsData, usersData] = await Promise.all([
            getPhysicalPieces(),
            getProducts(),
            getUsers(1000)
        ]);
        setPieces(piecesData || []);
        setProducts(productsData?.filter(p => p.is_physical_reward) || []);
        setUsers(usersData?.users || []);
        setSelectedIds([]); // Clear selection on refresh
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ... (useEffect for property/inventory)
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

    useEffect(() => {
        if (tagPropertyId) {
            getInventoriesByPropertyId(tagPropertyId).then(data => setTagInventories(data || []));
        } else {
            setTagInventories([]);
        }
        setTagInventoryId('');
    }, [tagPropertyId]);

    useEffect(() => {
        if (tagInventoryId) {
            getTreesByInventoryId(tagInventoryId, 1, 1000).then(res => setTagTrees(res?.data?.inventories || []));
        } else {
            setTagTrees([]);
        }
        setTagSourceTree(null);
    }, [tagInventoryId]);

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

    const handleAssociateTag = async () => {
        if (!tagValue.trim()) {
            setSnackbar({ open: true, message: 'Insira o valor da etiqueta', severity: 'warning' });
            return;
        }
        if (!tagSourceTree) {
            setSnackbar({ open: true, message: 'Selecione a árvore de origem (obrigatório)', severity: 'warning' });
            return;
        }
        try {
            const res = await associateTagToPhysicalPiece(selectedPiece.id, tagValue, tagSourceTree.id);
            if (res) {
                setSnackbar({ open: true, message: 'Etiqueta associada com sucesso', severity: 'success' });
                setTagValue('');
                fetchData();
                setSelectedPiece(prev => ({
                    ...prev,
                    labels: [...(prev.labels || []), { id: res.id || Math.random(), tag_value: tagValue, source_tree_id: tagSourceTree.id }]
                }));
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || 'Erro ao associar etiqueta';
            setSnackbar({ open: true, message: errMsg, severity: 'error' });
        }
    };

    const handleDisassociateTag = async (labelId) => {
        const ok = await disassociateTagFromPhysicalPiece(selectedPiece.id, labelId);
        if (ok) {
            setSnackbar({ open: true, message: 'Etiqueta desassociada com sucesso', severity: 'success' });
            fetchData();
            setSelectedPiece(prev => ({
                ...prev,
                labels: (prev.labels || []).filter(l => l.id !== labelId)
            }));
        } else {
            setSnackbar({ open: true, message: 'Erro ao desassociar etiqueta', severity: 'error' });
        }
    };

    const downloadLabel = async (pieceId) => {
        setDownloadingLabel(prev => ({ ...prev, [pieceId]: true }));
        try {
            const response = await api.get(`/admin/pecas/${pieceId}/label`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'image/png' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `label-${pieceId}.png`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading label:', error);
            setSnackbar({ open: true, message: 'Erro ao baixar etiqueta', severity: 'error' });
        } finally {
            setDownloadingLabel(prev => ({ ...prev, [pieceId]: false }));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === pieces.length && pieces.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pieces.map(p => p.id));
        }
    };

    const downloadBulkLabels = async () => {
        if (selectedIds.length === 0) return;
        setDownloadingBulk(true);
        try {
            const response = await api.post('/admin/pecas/labels/bulk', { ids: selectedIds }, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `labels-bulk-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            setSnackbar({ open: true, message: 'PDF de etiquetas gerado com sucesso', severity: 'success' });
        } catch (error) {
            console.error("Error downloading bulk labels:", error);
            setSnackbar({ open: true, message: 'Erro ao baixar etiquetas', severity: 'error' });
        } finally {
            setDownloadingBulk(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">Gestão de Peças Físicas (Recompensas)</Typography>
                <Box display="flex" gap={2}>
                    {selectedIds.length > 0 && (
                        <Button 
                            variant="outlined" 
                            color="secondary" 
                            startIcon={downloadingBulk ? <CircularProgress size={20} /> : <PictureAsPdf />} 
                            onClick={downloadBulkLabels}
                            disabled={downloadingBulk}
                        >
                            Baixar Selecionados ({selectedIds.length})
                        </Button>
                    )}
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
                                <TableCell padding="checkbox">
                                    <Checkbox 
                                        indeterminate={selectedIds.length > 0 && selectedIds.length < pieces.length}
                                        checked={pieces.length > 0 && selectedIds.length === pieces.length}
                                        onChange={toggleSelectAll}
                                    />
                                </TableCell>
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
                                <TableRow key={piece.id} hover selected={selectedIds.includes(piece.id)}>
                                    <TableCell padding="checkbox">
                                        <Checkbox 
                                            checked={selectedIds.includes(piece.id)}
                                            onChange={() => toggleSelect(piece.id)}
                                        />
                                    </TableCell>
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
                                        <IconButton
                                            size="small"
                                            title="Baixar Placa"
                                            onClick={() => downloadLabel(piece.id)}
                                            disabled={!!downloadingLabel[piece.id]}
                                        >
                                            {downloadingLabel[piece.id]
                                                ? <CircularProgress size={16} />
                                                : <Download />}
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            color="primary" 
                                            title="Atribuir a Cliente"
                                            onClick={() => {
                                                setSelectedPiece(piece);
                                                setSelectedUserForAttr(null);
                                                setUserId('');
                                                setOpenAttrDialog(true);
                                            }}
                                        >
                                            <AssignmentInd />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="secondary"
                                            title="Gerenciar Etiquetas"
                                            onClick={() => {
                                                setSelectedPiece(piece);
                                                setTagValue('');
                                                setTagPropertyId('');
                                                setTagInventoryId('');
                                                setTagSourceTree(null);
                                                setOpenTagDialog(true);
                                            }}
                                        >
                                            <QrCode />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {pieces.length === 0 && (
                                <TableRow><TableCell colSpan={7} align="center">Nenhuma peça encontrada</TableCell></TableRow>
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
            <Dialog open={openAttrDialog} onClose={() => setOpenAttrDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Atribuir Peça a Cliente</DialogTitle>
                <DialogContent>
                    <Box pt={1}>
                        <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                            Busque e selecione o cliente para atribuir esta peça física.
                        </Typography>
                        <Autocomplete
                            options={users}
                            getOptionLabel={(option) => {
                                if (!option) return '';
                                const name = option.first_name ? `${option.first_name} ${option.last_name}` : option.name || '';
                                return `#${option.id} - ${name} (${option.email})`;
                            }}
                            renderInput={(params) => <TextField {...params} label="Buscar Cliente" />}
                            value={selectedUserForAttr}
                            onChange={(e, val) => {
                                setSelectedUserForAttr(val);
                                setUserId(val ? String(val.id) : '');
                            }}
                            isOptionEqualToValue={(option, val) => option?.id === val?.id}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAttrDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleAttribute} disabled={!userId}>Atribuir</Button>
                </DialogActions>
            </Dialog>

            {/* Tag Association Dialog */}
            <Dialog open={openTagDialog} onClose={() => setOpenTagDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Gerenciar Etiquetas - {selectedPiece?.slug}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {/* Left Side: Current Tags */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Etiquetas Associadas
                            </Typography>
                            <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                                {selectedPiece?.labels?.map((label) => (
                                    <Box 
                                        key={label.id} 
                                        display="flex" 
                                        justifyContent="space-between" 
                                        alignItems="center" 
                                        p={1.5} 
                                        sx={{ 
                                            bgcolor: 'action.hover', 
                                            mb: 1, 
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2"><strong>Código:</strong> {label.tag_value}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Árvore Origem ID: {label.source_tree_id}
                                            </Typography>
                                        </Box>
                                        <IconButton size="small" color="error" onClick={() => handleDisassociateTag(label.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                                {(!selectedPiece?.labels || selectedPiece.labels.length === 0) && (
                                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', py: 2 }}>
                                        Nenhuma etiqueta associada a esta peça física. O status atual é DRAFT.
                                    </Typography>
                                )}
                            </Box>
                        </Grid>

                        {/* Right Side: Associate New Tag Form */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Associar Nova Etiqueta
                            </Typography>
                            <Grid container spacing={2} pt={1}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Código da Etiqueta (QR / Barcode)"
                                        placeholder="Ex: ARPT-ET-12345"
                                        value={tagValue}
                                        onChange={(e) => setTagValue(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        select fullWidth label="Propriedade da Árvore"
                                        value={tagPropertyId}
                                        onChange={(e) => setTagPropertyId(e.target.value)}
                                    >
                                        {properties.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        select fullWidth label="Inventário"
                                        value={tagInventoryId}
                                        onChange={(e) => setTagInventoryId(e.target.value)}
                                        disabled={!tagPropertyId}
                                    >
                                        {tagInventories.map(i => <MenuItem key={i.id} value={i.id}>Inventário {i.id}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12}>
                                    <Autocomplete
                                        options={tagTrees}
                                        getOptionLabel={(option) => `Árvore #${option.number} - ${option.specieName}`}
                                        renderInput={(params) => <TextField {...params} label="Árvore Origem (Obrigatório)" required />}
                                        value={tagSourceTree}
                                        onChange={(e, val) => setTagSourceTree(val)}
                                        disabled={!tagInventoryId}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        fullWidth 
                                        onClick={handleAssociateTag}
                                        disabled={!tagValue.trim() || !tagSourceTree}
                                    >
                                        Associar e Tornar Pública
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenTagDialog(false)}>Fechar</Button>
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
