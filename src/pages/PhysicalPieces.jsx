import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    MenuItem, CircularProgress, Alert, Snackbar, Grid, Autocomplete,
    Divider, Tooltip
} from '@mui/material';
import {
    Add, AssignmentInd, Refresh, Download, History,
    Visibility, QrCode2, LocalShipping, Inventory2
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { useAdmin } from '../contexts/AdminContext';
import { api } from '../services/api';

const STATUS_OPTIONS = [
    { value: 'DRAFT', label: 'Rascunho' },
    { value: 'MANUFACTURE', label: 'Em Produção' },
    { value: 'READY', label: 'Pronta' },
    { value: 'PUBLIC', label: 'Pública (Atribuída)' },
];

const STATUS_COLORS = {
    DRAFT: 'default',
    MANUFACTURE: 'warning',
    READY: 'info',
    PUBLIC: 'success',
};

const EVENT_LABELS = {
    HARVEST: 'Colheita / Origem',
    MANUFACTURE: 'Manufatura',
    POLISH: 'Acabamento',
    SHIP: 'Envio / Atribuição',
    DELIVERED: 'Entregue',
    OTHER: 'Evento',
};

export const PhysicalPieces = () => {
    const {
        properties,
        getPhysicalPieces,
        getPhysicalPiece,
        createPhysicalPiece,
        updatePhysicalPiece,
        attributePhysicalPiece,
        getUserPurchases,
        getProducts,
        getInventoriesByPropertyId,
        getTreesByInventoryId,
        getUsers
    } = useAdmin();

    const [pieces, setPieces] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [downloadingLabel, setDownloadingLabel] = useState({});

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
    const [users, setUsers] = useState([]);
    const [selectedUserForAttr, setSelectedUserForAttr] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [loadingPurchases, setLoadingPurchases] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    // Details Dialog state
    const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
    const [pieceDetails, setPieceDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const [piecesData, productsData, usersData] = await Promise.all([
            getPhysicalPieces(),
            getProducts(),
            getUsers(1000)
        ]);
        setPieces(Array.isArray(piecesData) ? piecesData : []);
        setProducts(productsData?.filter(p => p.is_physical_reward) || []);
        setUsers(usersData?.users || []);
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
            id_produto: Number(selectedProductId)
        });

        if (res) {
            setSnackbar({ open: true, message: 'Peça física criada com sucesso', severity: 'success' });
            setOpenDialog(false);
            setSelectedPropertyId('');
            setSelectedInventoryId('');
            setSelectedTree(null);
            setSelectedProductId('');
            fetchData();
        } else {
            setSnackbar({ open: true, message: 'Erro ao criar peça', severity: 'error' });
        }
    };

    const handleAttribute = async () => {
        if (!selectedPurchase) return;
        const res = await attributePhysicalPiece(selectedPiece.id, selectedPurchase.id);
        if (res) {
            setSnackbar({ open: true, message: 'Peça atribuída e publicada com sucesso', severity: 'success' });
            setOpenAttrDialog(false);
            fetchData();
        } else {
            setSnackbar({ open: true, message: 'Erro ao atribuir peça', severity: 'error' });
        }
    };

    const onSelectUserForAttr = async (usr) => {
        setSelectedUserForAttr(usr);
        setSelectedPurchase(null);
        setPurchases([]);
        if (!usr) return;
        setLoadingPurchases(true);
        const data = await getUserPurchases(String(usr.id), usr.email);
        setPurchases(Array.isArray(data) ? data : []);
        setLoadingPurchases(false);
    };

    const openDetails = async (piece) => {
        setSelectedPiece(piece);
        setPieceDetails(null);
        setOpenDetailsDialog(true);
        setLoadingDetails(true);
        const details = await getPhysicalPiece(piece.id);
        setPieceDetails(details);
        setLoadingDetails(false);
    };

    const downloadLabel = async (pieceId, format = 'svg') => {
        setDownloadingLabel(prev => ({ ...prev, [`${pieceId}-${format}`]: true }));
        try {
            const response = await api.get(`/admin/pecas/${pieceId}/label`, {
                params: { format },
                responseType: 'blob'
            });
            const mime = format === 'png' ? 'image/png' : 'image/svg+xml';
            const url = window.URL.createObjectURL(new Blob([response.data], { type: mime }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `peca-${pieceId}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading label:', error);
            setSnackbar({ open: true, message: 'Erro ao baixar etiqueta', severity: 'error' });
        } finally {
            setDownloadingLabel(prev => ({ ...prev, [`${pieceId}-${format}`]: false }));
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!pieceDetails) return;
        const updated = await updatePhysicalPiece(pieceDetails.id, { status: newStatus });
        if (updated) {
            setSnackbar({ open: true, message: 'Status atualizado com sucesso', severity: 'success' });
            const details = await getPhysicalPiece(pieceDetails.id);
            setPieceDetails(details);
            fetchData();
        } else {
            setSnackbar({ open: true, message: 'Erro ao atualizar status', severity: 'error' });
        }
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
                                <TableCell>Código de Barras</TableCell>
                                <TableCell>Produto</TableCell>
                                <TableCell>Árvore Origem</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pieces.map((piece) => (
                                <TableRow key={piece.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">{piece.slug}</Typography>
                                        <Typography variant="caption" color="textSecondary">{piece.id}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{piece.barcode_number}</Typography>
                                    </TableCell>
                                    <TableCell>{piece.produto_nome || products.find(p => p.id === piece.id_produto)?.nome || piece.id_produto}</TableCell>
                                    <TableCell>Árvore #{piece.arvore_numero || piece.id_arvore}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={STATUS_OPTIONS.find(s => s.value === piece.status)?.label || piece.status}
                                            size="small"
                                            color={STATUS_COLORS[piece.status] || 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>{piece.id_usuario || piece.compra_email ? `Atribuída (${piece.compra_email || piece.id_usuario})` : 'Não atribuída'}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Detalhes e Timeline">
                                            <IconButton size="small" color="info" onClick={() => openDetails(piece)}>
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Baixar Placa (SVG)">
                                            <IconButton
                                                size="small"
                                                onClick={() => downloadLabel(piece.id, 'svg')}
                                                disabled={!!downloadingLabel[`${piece.id}-svg`]}
                                            >
                                                {downloadingLabel[`${piece.id}-svg`] ? <CircularProgress size={16} /> : <Download />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Atribuir a Cliente">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => {
                                                    setSelectedPiece(piece);
                                                    setSelectedUserForAttr(null);
                                                    setSelectedPurchase(null);
                                                    setPurchases([]);
                                                    setOpenAttrDialog(true);
                                                }}
                                            >
                                                <AssignmentInd />
                                            </IconButton>
                                        </Tooltip>
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

            {/* Create Piece Dialog (wizard: Propriedade -> Inventário -> Árvore -> Produto) */}
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

            {/* Attribution Dialog (links piece to a reward purchase) */}
            <Dialog open={openAttrDialog} onClose={() => setOpenAttrDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Atribuir Peça a Cliente</DialogTitle>
                <DialogContent>
                    <Box pt={1} display="flex" flexDirection="column" gap={2}>
                        <Typography variant="body2" color="textSecondary">
                            Selecione o cliente e, em seguida, a compra de recompensa à qual esta peça pertence.
                            A peça passa a ser pública após a atribuição.
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
                            onChange={(e, val) => onSelectUserForAttr(val)}
                            isOptionEqualToValue={(option, val) => option?.id === val?.id}
                            fullWidth
                        />
                        <Autocomplete
                            options={purchases}
                            loading={loadingPurchases}
                            getOptionLabel={(option) => {
                                if (!option) return '';
                                const date = option.created_at ? new Date(option.created_at).toLocaleDateString('pt-BR') : '';
                                return `#${option.id} - ${option.product_name || 'Recompensa'} (${date})`;
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Compra de Recompensa"
                                    placeholder={selectedUserForAttr ? 'Selecione a compra' : 'Selecione um cliente primeiro'}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingPurchases ? <CircularProgress size={18} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                            value={selectedPurchase}
                            onChange={(e, val) => setSelectedPurchase(val)}
                            isOptionEqualToValue={(option, val) => option?.id === val?.id}
                            disabled={!selectedUserForAttr}
                            noOptionsText="Nenhuma compra encontrada para este cliente"
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAttrDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleAttribute} disabled={!selectedPurchase}>Atribuir</Button>
                </DialogActions>
            </Dialog>

            {/* Piece Details Dialog (Timeline + Rectangular Label) */}
            <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Detalhes da Peça {pieceDetails?.slug ? `- ${pieceDetails.slug}` : ''}
                </DialogTitle>
                <DialogContent dividers>
                    {loadingDetails || !pieceDetails ? (
                        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                    ) : (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Identificação</Typography>
                                <Box p={2} borderRadius={2} sx={{ bgcolor: 'action.hover', mb: 2 }}>
                                    <Typography variant="body2"><strong>Slug:</strong> {pieceDetails.slug}</Typography>
                                    <Typography variant="body2"><strong>Código de barras:</strong> {pieceDetails.barcode_number}</Typography>
                                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                        <strong>URL pública:</strong> {pieceDetails.url}
                                    </Typography>
                                </Box>
                                <Box display="flex" justifyContent="center" p={2} sx={{ bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                    <QRCodeSVG value={pieceDetails.url || ''} size={160} level="M" />
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <TextField
                                    select
                                    fullWidth
                                    label="Status"
                                    value={pieceDetails.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                >
                                    {STATUS_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                                </TextField>
                                <Box display="flex" gap={2} mt={2}>
                                    <Button
                                        variant="outlined"
                                        startIcon={downloadingLabel[`${pieceDetails.id}-svg`] ? <CircularProgress size={18} /> : <Download />}
                                        onClick={() => downloadLabel(pieceDetails.id, 'svg')}
                                        disabled={!!downloadingLabel[`${pieceDetails.id}-svg`]}
                                    >
                                        Placa (SVG)
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={downloadingLabel[`${pieceDetails.id}-png`] ? <CircularProgress size={18} /> : <Download />}
                                        onClick={() => downloadLabel(pieceDetails.id, 'png')}
                                        disabled={!!downloadingLabel[`${pieceDetails.id}-png`]}
                                    >
                                        Placa (PNG)
                                    </Button>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    <History sx={{ verticalAlign: 'middle', mr: 1 }} fontSize="small" />
                                    Timeline de Produção
                                </Typography>
                                {(pieceDetails.eventos && pieceDetails.eventos.length > 0) ? (
                                    <Box sx={{ position: 'relative', pl: 2 }}>
                                        <Box sx={{
                                            position: 'absolute', left: 15, top: 8, bottom: 8,
                                            width: 2, bgcolor: 'divider', zIndex: 0
                                        }} />
                                        {pieceDetails.eventos.map((ev) => (
                                            <Box key={ev.id} sx={{ mb: 2, position: 'relative', pl: 4, zIndex: 1 }}>
                                                <Box sx={{
                                                    position: 'absolute', left: 0, top: 6,
                                                    width: 14, height: 14, borderRadius: '50%',
                                                    bgcolor: 'primary.main', border: '3px solid white',
                                                    boxShadow: '0 0 0 2px', color: 'primary.main'
                                                }} />
                                                <Typography variant="body2" fontWeight="bold">
                                                    {EVENT_LABELS[ev.tipo] || ev.tipo}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" display="block">
                                                    {ev.data_evento ? new Date(ev.data_evento).toLocaleString('pt-BR') : ''}
                                                </Typography>
                                                {ev.detalhes && (
                                                    <Typography variant="caption" color="textSecondary" display="block">
                                                        {typeof ev.detalhes === 'object' ? (ev.detalhes.descricao || JSON.stringify(ev.detalhes)) : String(ev.detalhes)}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Box display="flex" flexDirection="column" alignItems="center" py={4} color="text.secondary">
                                        <Inventory2 sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                                        <Typography variant="body2">Nenhum evento de produção registrado ainda.</Typography>
                                    </Box>
                                )}
                                {pieceDetails.arvore_especie && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Origem Biológica</Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <QrCode2 color="success" fontSize="small" />
                                            <Typography variant="body2">
                                                {pieceDetails.arvore_nome_popular || pieceDetails.arvore_especie} #{pieceDetails.arvore_numero}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            DAP: {pieceDetails.arvore_dap} cm • Altura: {pieceDetails.arvore_altura} m
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                                            <LocalShipping color="success" fontSize="small" />
                                            <Typography variant="caption" color="textSecondary">
                                                {pieceDetails.arvore_latitude}, {pieceDetails.arvore_longitude}
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetailsDialog(false)}>Fechar</Button>
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
