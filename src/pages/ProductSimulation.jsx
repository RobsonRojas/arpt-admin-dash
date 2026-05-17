import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Table, TableContainer, TableHead,
    TableRow, TableCell, TableBody, Paper, CircularProgress, Alert, Snackbar,
    TextField, Chip, Card, CardContent, CardActions, Checkbox,
    FormControlLabel, Divider, InputAdornment, Stepper, Step, StepLabel,
    Skeleton, Avatar, Grid
} from '@mui/material';
import {
    Search, AccountTree, Inventory2, Calculate,
    Park, TrendingUp, CheckCircle, InfoOutlined
} from '@mui/icons-material';
import { api } from '../services/api';

export const ProductSimulation = () => {
    // Stepper
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Selecionar Projeto', 'Selecionar Árvore', 'Simular Receita'];

    // Project / Inventory state
    const [manejos, setManejos] = useState([]);
    const [selectedManejo, setSelectedManejo] = useState(null);
    const [inventarios, setInventarios] = useState([]);
    const [selectedInventario, setSelectedInventario] = useState(null);

    // Trees state
    const [trees, setTrees] = useState([]);
    const [treesLoading, setTreesLoading] = useState(false);
    const [treeSearch, setTreeSearch] = useState('');
    const [selectedTree, setSelectedTree] = useState(null);

    // Products state
    const [compatibleProducts, setCompatibleProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState([]);

    // Simulation state
    const [simulationResult, setSimulationResult] = useState(null);
    const [simulationLoading, setSimulationLoading] = useState(false);

    // General
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    // Fetch manejos on mount
    useEffect(() => {
        const fetchManejos = async () => {
            setLoading(true);
            try {
                const response = await api.get('/manejos');
                const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                setManejos(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching manejos:', err);
                setError('Erro ao carregar projetos de manejo');
            } finally {
                setLoading(false);
            }
        };
        fetchManejos();
    }, []);

    // Fetch inventories when manejo is selected
    useEffect(() => {
        if (!selectedManejo) return;
        const fetchInventarios = async () => {
            try {
                const response = await api.get(`/manejos/${selectedManejo.id}/inventarios`);
                const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                setInventarios(data);
                if (data.length > 0) {
                    setSelectedInventario(data[0]);
                }
            } catch (err) {
                console.error('Error fetching inventarios:', err);
                setSnackbar({ open: true, message: 'Erro ao carregar inventários', severity: 'error' });
            }
        };
        fetchInventarios();
    }, [selectedManejo]);

    // Fetch trees when inventory is selected
    useEffect(() => {
        if (!selectedInventario) return;
        const fetchTrees = async () => {
            setTreesLoading(true);
            try {
                const response = await api.get(`/inventarios/${selectedInventario.id}/trees`);
                const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                setTrees(data);
            } catch (err) {
                console.error('Error fetching trees:', err);
                setSnackbar({ open: true, message: 'Erro ao carregar árvores', severity: 'error' });
            } finally {
                setTreesLoading(false);
            }
        };
        fetchTrees();
    }, [selectedInventario]);

    // Fetch compatible products when tree is selected
    useEffect(() => {
        if (!selectedTree) {
            setCompatibleProducts([]);
            setSelectedProductIds([]);
            setSimulationResult(null);
            return;
        }
        const fetchProducts = async () => {
            setProductsLoading(true);
            try {
                const response = await api.get(`/manejos/trees/${selectedTree.id}/compatible-products`);
                const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                setCompatibleProducts(data);
                setSelectedProductIds([]);
                setSimulationResult(null);
            } catch (err) {
                console.error('Error fetching compatible products:', err);
                setCompatibleProducts([]);
                setSnackbar({ open: true, message: 'Erro ao carregar produtos compatíveis', severity: 'error' });
            } finally {
                setProductsLoading(false);
            }
        };
        fetchProducts();
    }, [selectedTree]);

    const handleSelectManejo = (manejo) => {
        setSelectedManejo(manejo);
        setSelectedInventario(null);
        setInventarios([]);
        setTrees([]);
        setSelectedTree(null);
        setCompatibleProducts([]);
        setSelectedProductIds([]);
        setSimulationResult(null);
        setActiveStep(1);
    };

    const handleSelectTree = (tree) => {
        setSelectedTree(tree);
        setActiveStep(2);
    };

    const handleToggleProduct = (productId) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
        setSimulationResult(null);
    };

    const handleSimulate = async () => {
        if (!selectedTree || selectedProductIds.length === 0) return;
        setSimulationLoading(true);
        try {
            const response = await api.post('/manejos/simulate-income', {
                treeId: selectedTree.id,
                productIds: selectedProductIds
            });
            setSimulationResult(response.data);
        } catch (err) {
            console.error('Error simulating income:', err);
            setSnackbar({ open: true, message: 'Erro ao simular receita', severity: 'error' });
        } finally {
            setSimulationLoading(false);
        }
    };

    // Filter trees by search
    const filteredTrees = trees.filter(tree => {
        if (!treeSearch.trim()) return true;
        const search = treeSearch.toLowerCase().trim();
        return (
            String(tree.number || tree.numero).includes(search) ||
            (tree.specie_name || tree.specieName || '').toLowerCase().includes(search)
        );
    });

    return (
        <Box sx={{ animation: 'fadeIn 0.5s', p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={600}>
                        Simulação de Produto por Árvore
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Selecione uma árvore do inventário para simular a receita potencial com produtos compatíveis.
                    </Typography>
                </Box>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
                {steps.map((label, index) => (
                    <Step key={label} completed={
                        (index === 0 && selectedManejo != null) ||
                        (index === 1 && selectedTree != null) ||
                        (index === 2 && simulationResult != null)
                    }>
                        <StepLabel
                            onClick={() => {
                                if (index === 0) setActiveStep(0);
                                else if (index === 1 && selectedManejo) setActiveStep(1);
                                else if (index === 2 && selectedTree) setActiveStep(2);
                            }}
                            sx={{ cursor: 'pointer' }}
                        >
                            {label}
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Step 1: Project Selection */}
            {activeStep === 0 && (
                <Box>
                    <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
                        <AccountTree color="primary" /> Selecione um Projeto de Manejo
                    </Typography>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={4}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            {manejos.map((manejo) => (
                                <Grid item xs={12} sm={6} md={4} key={manejo.id}>
                                    <Card
                                        elevation={selectedManejo?.id === manejo.id ? 4 : 1}
                                        sx={{
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            border: selectedManejo?.id === manejo.id ? '2px solid' : '1px solid transparent',
                                            borderColor: selectedManejo?.id === manejo.id ? 'primary.main' : 'transparent',
                                            '&:hover': {
                                                elevation: 3,
                                                transform: 'translateY(-2px)',
                                                boxShadow: 3
                                            }
                                        }}
                                        onClick={() => handleSelectManejo(manejo)}
                                    >
                                        <CardContent>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                                    <Park sx={{ fontSize: 18 }} />
                                                </Avatar>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    {manejo.nome || manejo.name || `Manejo #${manejo.id}`}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {manejo.descricao || manejo.description || 'Sem descrição'}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                            {manejos.length === 0 && (
                                <Grid item xs={12}>
                                    <Alert severity="info">Nenhum projeto de manejo encontrado.</Alert>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </Box>
            )}

            {/* Step 2: Tree Selection */}
            {activeStep === 1 && selectedManejo && (
                <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                            <Inventory2 color="primary" /> Árvores do Inventário
                        </Typography>
                        <Button variant="text" size="small" onClick={() => setActiveStep(0)}>
                            ← Trocar Projeto
                        </Button>
                    </Box>

                    {/* Inventory selector (if multiple) */}
                    {inventarios.length > 1 && (
                        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                            {inventarios.map(inv => (
                                <Chip
                                    key={inv.id}
                                    label={inv.nome || inv.name || `Inventário #${inv.id}`}
                                    color={selectedInventario?.id === inv.id ? 'primary' : 'default'}
                                    onClick={() => {
                                        setSelectedInventario(inv);
                                        setSelectedTree(null);
                                    }}
                                    variant={selectedInventario?.id === inv.id ? 'filled' : 'outlined'}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Search */}
                    <TextField
                        placeholder="Buscar por número ou espécie..."
                        size="small"
                        fullWidth
                        value={treeSearch}
                        onChange={(e) => setTreeSearch(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            )
                        }}
                    />

                    {treesLoading ? (
                        <Box display="flex" flexDirection="column" gap={1}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
                            ))}
                        </Box>
                    ) : (
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', maxHeight: 480 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f9fafb' }}>Nº</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f9fafb' }}>Espécie</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f9fafb' }}>DAP (cm)</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f9fafb' }}>Altura (m)</TableCell>
                                        <TableCell sx={{ fontWeight: 600, bgcolor: '#f9fafb' }}>Volume (m³)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredTrees.map((tree) => (
                                        <TableRow
                                            key={tree.id}
                                            hover
                                            selected={selectedTree?.id === tree.id}
                                            onClick={() => handleSelectTree(tree)}
                                            sx={{
                                                cursor: 'pointer',
                                                '&.Mui-selected': {
                                                    bgcolor: 'primary.50',
                                                    '&:hover': { bgcolor: 'primary.100' }
                                                }
                                            }}
                                        >
                                            <TableCell>
                                                <Chip
                                                    label={`#${tree.number || tree.numero}`}
                                                    size="small"
                                                    color={selectedTree?.id === tree.id ? 'primary' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {tree.specie_name || tree.specieName || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{(tree.dap || tree.dbh || 0).toFixed(1)}</TableCell>
                                            <TableCell>{(tree.height || tree.altura || 0).toFixed(1)}</TableCell>
                                            <TableCell>{(tree.volume || 0).toFixed(3)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredTrees.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                <Typography variant="body2" color="text.secondary" py={2}>
                                                    {treeSearch ? 'Nenhuma árvore encontrada para a busca.' : 'Nenhuma árvore no inventário.'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}

            {/* Step 3: Products & Simulation */}
            {activeStep === 2 && selectedTree && (
                <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                            <Calculate color="primary" /> Simulação de Receita
                        </Typography>
                        <Button variant="text" size="small" onClick={() => setActiveStep(1)}>
                            ← Trocar Árvore
                        </Button>
                    </Box>

                    {/* Tree Summary Card */}
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <Park />
                            </Avatar>
                            <Box flex={1}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    Árvore #{selectedTree.number || selectedTree.numero} — {selectedTree.specie_name || selectedTree.specieName || 'Espécie desconhecida'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    DAP: {(selectedTree.dap || selectedTree.dbh || 0).toFixed(1)} cm
                                    {' · '}Altura: {(selectedTree.height || selectedTree.altura || 0).toFixed(1)} m
                                    {' · '}Volume: {(selectedTree.volume || 0).toFixed(3)} m³
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    <Grid container spacing={3}>
                        {/* Compatible Products */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" fontWeight={600} mb={1}>
                                Produtos Compatíveis
                            </Typography>

                            {productsLoading ? (
                                <Box display="flex" flexDirection="column" gap={1}>
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
                                    ))}
                                </Box>
                            ) : compatibleProducts.length === 0 ? (
                                <Alert severity="info" icon={<InfoOutlined />}>
                                    Nenhum produto compatível encontrado para esta árvore.
                                </Alert>
                            ) : (
                                <Box display="flex" flexDirection="column" gap={1.5}>
                                    {compatibleProducts.map(product => (
                                        <Card
                                            key={product.id}
                                            variant="outlined"
                                            sx={{
                                                transition: 'all 0.2s ease',
                                                borderColor: selectedProductIds.includes(product.id)
                                                    ? 'primary.main' : 'divider',
                                                bgcolor: selectedProductIds.includes(product.id)
                                                    ? 'primary.50' : 'background.paper',
                                                '&:hover': { borderColor: 'primary.light' }
                                            }}
                                        >
                                            <CardContent sx={{ pb: '8px !important' }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={selectedProductIds.includes(product.id)}
                                                            onChange={() => handleToggleProduct(product.id)}
                                                            color="primary"
                                                        />
                                                    }
                                                    label={
                                                        <Box>
                                                            <Typography variant="subtitle2" fontWeight={600}>
                                                                {product.nome}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {product.info || 'Sem descrição'}
                                                            </Typography>
                                                            <Chip
                                                                label={`R$ ${(product.preco || 0).toFixed(2)}`}
                                                                size="small"
                                                                color="success"
                                                                variant="outlined"
                                                                sx={{ mt: 0.5 }}
                                                            />
                                                        </Box>
                                                    }
                                                    sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
                                                />
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={simulationLoading ? <CircularProgress size={20} color="inherit" /> : <TrendingUp />}
                                        onClick={handleSimulate}
                                        disabled={selectedProductIds.length === 0 || simulationLoading}
                                        fullWidth
                                        sx={{ mt: 1, py: 1.5 }}
                                    >
                                        {simulationLoading ? 'Simulando...' : `Simular Receita (${selectedProductIds.length} produto${selectedProductIds.length !== 1 ? 's' : ''})`}
                                    </Button>
                                </Box>
                            )}
                        </Grid>

                        {/* Revenue Result */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" fontWeight={600} mb={1}>
                                Resultado da Simulação
                            </Typography>

                            {simulationResult ? (
                                <Box>
                                    {/* Total Revenue Card */}
                                    <Paper
                                        elevation={2}
                                        sx={{
                                            p: 3,
                                            mb: 2,
                                            background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                                            color: 'white',
                                            borderRadius: 2
                                        }}
                                    >
                                        <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                            Receita Total Estimada
                                        </Typography>
                                        <Typography variant="h3" fontWeight={700}>
                                            R$ {(simulationResult.total_revenue || 0).toFixed(2)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                                            {selectedProductIds.length} produto{selectedProductIds.length !== 1 ? 's' : ''} · Estimativa baseada em volume calculado
                                        </Typography>
                                    </Paper>

                                    {/* Breakdown */}
                                    {simulationResult.breakdown && simulationResult.breakdown.length > 0 && (
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 600 }}>Produto</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>Volume</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>Preço Unit.</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {simulationResult.breakdown.map((item, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight={500}>
                                                                    {item.product_name || item.nome}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>{(item.volume || 0).toFixed(3)} m³</TableCell>
                                                            <TableCell>R$ {(item.unit_price || item.preco || 0).toFixed(2)}</TableCell>
                                                            <TableCell>
                                                                <Typography fontWeight={600} color="success.main">
                                                                    R$ {(item.subtotal || 0).toFixed(2)}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}

                                    <Alert severity="info" sx={{ mt: 2 }} icon={<InfoOutlined />}>
                                        Os valores apresentados são <strong>estimativas</strong> baseadas no volume calculado e preço unitário dos produtos.
                                        Valores reais podem variar de acordo com qualidade da madeira e condições de mercado.
                                    </Alert>
                                </Box>
                            ) : (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 4,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: 200,
                                        bgcolor: '#fafafa'
                                    }}
                                >
                                    <TrendingUp sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                                    <Typography variant="body1" color="text.secondary" align="center">
                                        Selecione produtos compatíveis e clique em "Simular Receita" para ver a estimativa de valor.
                                    </Typography>
                                </Paper>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
