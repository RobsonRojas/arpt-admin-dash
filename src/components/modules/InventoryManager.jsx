import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableContainer, TableHead, TableRow,
  TableCell, TableBody, IconButton, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  TablePagination, TableSortLabel, Collapse, Grid, InputAdornment
} from '@mui/material';
import { Edit, Add, ArrowBack, Park, Description, ContentCopy, FilterList, Tune } from '@mui/icons-material';
import { TreeForm } from './TreeForm';
import { useAdmin } from '../../contexts/AdminContext';
import { generateDocument } from '../../services/gemini';
import MDEditor from '@uiw/react-md-editor';


export const InventoryManager = ({ property, onClose }) => {
  const [inventories, setInventories] = useState([]);
  const [viewState, setViewState] = useState("list");
  const [editingTree, setEditingTree] = useState(null);
  const [loadingTrees, setLoadingTrees] = useState(false);

  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dados Comletos (Frontend Logic)
  const [allTrees, setAllTrees] = useState([]); // Store all fetched trees here

  // Filtros e Ordenação
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    plate: '',
    specie: '',
    popularName: '',
    dapMin: '',
    dapMax: '',
    volumeMin: '',
    volumeMax: '',
    heightMin: '',
    heightMax: ''
  });
  const {
    getInventoriesByPropertyId,
    getTreesByInventoryId,
    getAllInventoryByPropertyId,
    createInventory,
    createTree,
    updateTree,
  } = useAdmin();

  // Document Generation State
  const [openDocDialog, setOpenDocDialog] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(false);


  const [openCreateInventory, setOpenCreateInventory] = useState(false);
  const [currentInventoryId, setCurrentInventoryId] = useState(null);
  const [inventoryForm, setInventoryForm] = useState(() => {
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);

    const formatDateOnly = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD
    return {
      startDate: formatDateOnly(now),
      endDate: formatDateOnly(oneYearLater),
    };
  });

  const handleSaveTree = async (treeData) => {

    if (!currentInventoryId) {
      window.alert('Crie um inventário antes de cadastrar árvores.');
      return;
    }

    // Normaliza payload para API
    const nowIso = new Date().toISOString();
    const payload = {
      ...treeData,
      propertyId: Number(property.id),
      inventoryId: currentInventoryId,
      number: treeData.number ? Number(treeData.number) : (editingTree?.number || 1),
      cap: treeData.cap ? Number(treeData.cap) : 0,
      dap: treeData.dap ? Number(treeData.dap) : 0,
      height: treeData.height ? Number(treeData.height) : 0,
      comercialHeight: treeData.comercialHeight ? Number(treeData.comercialHeight) : 0,
      volume: treeData.volume ? Number(treeData.volume) : 0,
      cuttingVolume: treeData.cuttingVolume ? Number(treeData.cuttingVolume) : 0,
      latitude: treeData.latitude ? Number(treeData.latitude) : 0,
      longitude: treeData.longitude ? Number(treeData.longitude) : 0,
      coordPrecistion: treeData.coordPrecistion ? Number(treeData.coordPrecistion) : 1,
      classification: treeData.classification || 'Corte Futuro',
      createdAt: treeData.createdAt || nowIso,
      updatedAt: nowIso,
    };

    let result;
    if (editingTree && editingTree.id) {
      // Atualizar árvore existente
      result = await updateTree(editingTree.id, payload);
    } else {
      // Criar nova árvore
      result = await createTree(currentInventoryId, payload);
    }

    if (result) {
      await loadTrees({ suppressCreatePrompt: true });
      setViewState("list");
      setEditingTree(null);
      return;
    } else {
      window.alert('Não foi possível salvar a árvore. Tente novamente.');
    }
  };

  const handleEdit = (tree) => {
    setEditingTree(tree);
    setViewState("form");
  };

  const handleNew = () => {
    setEditingTree(null);
    setViewState("form");
  };

  const handleDelete = (treeId) => {
    if (window.confirm("Deseja remover esta árvore?")) {
      setAllTrees(allTrees.filter(t => t.id !== treeId));
    }
  };

  const handleCreateInventory = async () => {
    const now = new Date();
    const timeStr = now.toISOString().slice(11, 19); // HH:MM:SS

    const startDateTime = `${inventoryForm.startDate} ${timeStr}`;
    const endDateTime = `${inventoryForm.endDate} ${timeStr}`;

    const payload = {
      startDate: startDateTime,
      endDate: endDateTime,
      createdAt: `${inventoryForm.startDate} ${timeStr}`,
      updatedAt: `${inventoryForm.endDate} ${timeStr}`,
      propertyId: Number(property.id),
    };

    const created = await createInventory(payload);
    if (created) {
      setOpenCreateInventory(false);
      setCurrentInventoryId(created.id || created.inventoryId || null);
      // Evita reabrir modal se ainda não houver árvores
      await loadTrees({ suppressCreatePrompt: true });
    } else {
      window.alert('Não foi possível criar o inventário. Tente novamente.');
    }
  };


  const handleGenerateDocument = async (tree) => {
    setLoadingDoc(true);
    setOpenDocDialog(true);
    setGeneratedDoc("Gerando documento, por favor aguarde...");

    try {
      const doc = await generateDocument('fallen_tree', tree);
      setGeneratedDoc(doc);
    } catch (error) {
      setGeneratedDoc("Erro ao gerar documento. Tente novamente.");
    } finally {
      setLoadingDoc(false);
    }
  };

  const loadTrees = async () => {
    try {
      setLoadingTrees(true);

      // Backend limit is 100. We need to fetch all pages to perform frontend sorting/filtering.
      const BATCH_SIZE = 100;

      // 1. Fetch first page to get total count
      const firstPageResponse = await getAllInventoryByPropertyId(property.id, 1, BATCH_SIZE);

      let combinedTrees = [];
      let totalRecords = 0;

      if (firstPageResponse?.data?.inventories && Array.isArray(firstPageResponse.data.inventories)) {
        combinedTrees = [...firstPageResponse.data.inventories];
        totalRecords = firstPageResponse.data.total || combinedTrees.length;
      } else if (Array.isArray(firstPageResponse)) {
        // Fallback for array response
        combinedTrees = [...firstPageResponse];
        totalRecords = combinedTrees.length;
      } else if (firstPageResponse?.data && Array.isArray(firstPageResponse.data)) {
        // Fallback generic data array
        combinedTrees = [...firstPageResponse.data];
        totalRecords = combinedTrees.length;
      }

      // 2. Determine if more pages are needed
      if (totalRecords > combinedTrees.length) {
        const totalPages = Math.ceil(totalRecords / BATCH_SIZE);
        const promises = [];

        // Start from page 2
        for (let p = 2; p <= totalPages; p++) {
          promises.push(getAllInventoryByPropertyId(property.id, p, BATCH_SIZE));
        }

        if (promises.length > 0) {
          const results = await Promise.all(promises);
          results.forEach(res => {
            if (res?.data?.inventories && Array.isArray(res.data.inventories)) {
              combinedTrees = [...combinedTrees, ...res.data.inventories];
            } else if (Array.isArray(res)) {
              combinedTrees = [...combinedTrees, ...res];
            } else if (res?.data && Array.isArray(res.data)) {
              combinedTrees = [...combinedTrees, ...res.data];
            }
          });
        }
      }

      setAllTrees(combinedTrees);

      // Tentar inferir currentInventoryId
      if (combinedTrees.length > 0) {
        const firstTree = combinedTrees[0];
        const inferredId = firstTree.inventoryId || firstTree.inventory_id;
        if (inferredId && !currentInventoryId) {
          setCurrentInventoryId(inferredId);
        }
      }

      setOpenCreateInventory(false);

    } catch (error) {
      console.error("Erro ao carregar árvores:", error);
      setAllTrees([]);
    } finally {
      setLoadingTrees(false);
    }
  };

  // Lógica de Filtragem e Ordenação no Frontend
  const filteredAndSortedTrees = React.useMemo(() => {
    let result = [...allTrees];

    // 1. Filtragem
    if (filters.plate) {
      result = result.filter(t => t.number?.toString().toLowerCase().includes(filters.plate.toLowerCase()));
    }
    if (filters.specie) {
      result = result.filter(t => t.specieName?.toLowerCase().includes(filters.specie.toLowerCase()));
    }
    if (filters.popularName) {
      result = result.filter(t => t.popularName?.toLowerCase().includes(filters.popularName.toLowerCase()));
    }

    // Numeric Ranges
    if (filters.dapMin) result = result.filter(t => Number(t.dap) >= Number(filters.dapMin));
    if (filters.dapMax) result = result.filter(t => Number(t.dap) <= Number(filters.dapMax));

    if (filters.volumeMin) result = result.filter(t => Number(t.volume) >= Number(filters.volumeMin));
    if (filters.volumeMax) result = result.filter(t => Number(t.volume) <= Number(filters.volumeMax));

    if (filters.heightMin) result = result.filter(t => Number(t.height) >= Number(filters.heightMin));
    if (filters.heightMax) result = result.filter(t => Number(t.height) <= Number(filters.heightMax));


    // 2. Ordenação
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Handle null/undefined (optional)
      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      // Numeric comparison for numeric fields
      const numericFields = ['number', 'dap', 'cap', 'volume', 'height'];
      if (numericFields.includes(sortBy)) {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [allTrees, filters, sortBy, sortOrder]);

  // Paginação no Frontend
  const paginatedTrees = React.useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredAndSortedTrees.slice(start, end);
  }, [filteredAndSortedTrees, page, rowsPerPage]);

  const applyFilters = () => {
    setPage(0);
    // Filters are applied automatically by useMemo when 'filters' state changes.
    // The button acts more like a visual confirmation or refresh if we weren't reactive.
    // Since input onChange updates state, it's already filtered. 
    // If we want "Apply Info" behavior strictly, we'd need separate state for form inputs vs active filters.
    // But for now, reactive is fine and usually preferred.
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  useEffect(() => {
    loadTrees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id]); // Only reload when property changes. Pagination/Sort/Filter is local.



  const clearFilters = () => {
    setFilters({
      plate: '',
      specie: '',
      popularName: '',
      dapMin: '',
      dapMax: '',
      volumeMin: '',
      volumeMax: '',
      heightMin: '',
      heightMax: ''
    });
    setPage(0);
    // Needed to set state and then load, relying on separate effect or just calling loadTrees directly with cleared state?
    // Since loadTrees reads from state `filters`, we need to wait for state update or pass override. 
    // Easier way: useEffect that listens to 'filters' might be too aggressive if typing. 
    // Let's just reset state and let user click 'Apply' or handle it efficiently.
    // Ideally:
    // setFilters({...}); setActiveFilters({...});
  };

  const handleSortRequest = (property) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  if (viewState === "form") {
    return (
      <Box p={3} sx={{ bgcolor: 'background.paper', height: '100%' }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={() => setViewState("list")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" ml={1}>
            {editingTree ? 'Editar Árvore' : 'Nova Árvore'}
          </Typography>
        </Box>
        <Paper elevation={0} variant="outlined">
          <TreeForm
            initialData={editingTree}
            onSave={handleSaveTree}
            onCancel={() => setViewState("list")}
            propertyId={property.id}
            inventoryId={currentInventoryId}
          />
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={3} height="100%" display="flex" flexDirection="column" bgcolor="background.default">
      {/* CABEÇALHO */}
      <Paper sx={{ p: 2, mb: 2 }}>

        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <Park color="primary" /> Inventário de Árvores
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Propriedade: {property.name || property.proprietario}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<Tune />} onClick={() => setShowFilters(!showFilters)}>
              Filtros
            </Button>
            <Button variant="outlined" color="inherit" onClick={onClose}>
              Fechar
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={handleNew}>
              Cadastrar Árvore
            </Button>
          </Box>
        </Box>


      </Paper>

      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Filtros Avançados</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Nº Placa"
                variant="outlined"
                size="small"
                fullWidth
                value={filters.plate}
                onChange={(e) => setFilters({ ...filters, plate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Espécie"
                variant="outlined"
                size="small"
                fullWidth
                value={filters.specie}
                onChange={(e) => setFilters({ ...filters, specie: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Nome Popular"
                variant="outlined"
                size="small"
                fullWidth
                value={filters.popularName}
                onChange={(e) => setFilters({ ...filters, popularName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" gap={1} alignItems="center">
                <TextField label="DAP Min" size="small" type="number" value={filters.dapMin} onChange={(e) => setFilters({ ...filters, dapMin: e.target.value })} sx={{ width: '50%' }} />
                <Typography>-</Typography>
                <TextField label="Max" size="small" type="number" value={filters.dapMax} onChange={(e) => setFilters({ ...filters, dapMax: e.target.value })} sx={{ width: '50%' }} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" gap={1} alignItems="center">
                <TextField label="Vol Min" size="small" type="number" value={filters.volumeMin} onChange={(e) => setFilters({ ...filters, volumeMin: e.target.value })} sx={{ width: '50%' }} />
                <Typography>-</Typography>
                <TextField label="Max" size="small" type="number" value={filters.volumeMax} onChange={(e) => setFilters({ ...filters, volumeMax: e.target.value })} sx={{ width: '50%' }} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" gap={1} alignItems="center">
                <TextField label="Alt Min" size="small" type="number" value={filters.heightMin} onChange={(e) => setFilters({ ...filters, heightMin: e.target.value })} sx={{ width: '50%' }} />
                <Typography>-</Typography>
                <TextField label="Max" size="small" type="number" value={filters.heightMax} onChange={(e) => setFilters({ ...filters, heightMax: e.target.value })} sx={{ width: '50%' }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={4} display="flex" gap={1} justifyContent="flex-end">
              <Button onClick={() => { clearFilters(); setTimeout(loadTrees, 100); }}>Limpar</Button>
              <Button variant="contained" onClick={applyFilters}>Filtrar</Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* TABELA */}
      <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'number'}
                  direction={sortBy === 'number' ? sortOrder : 'asc'}
                  onClick={() => handleSortRequest('number')}
                >
                  Nº Placa
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'specieName'}
                  direction={sortBy === 'specieName' ? sortOrder : 'asc'}
                  onClick={() => handleSortRequest('specieName')}
                >
                  Espécie
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'popularName'}
                  direction={sortBy === 'popularName' ? sortOrder : 'asc'}
                  onClick={() => handleSortRequest('popularName')}
                >
                  Nome Popular
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'cap'}
                  direction={sortBy === 'cap' ? sortOrder : 'asc'}
                  onClick={() => handleSortRequest('cap')}
                >
                  CAP (cm)
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'dap'}
                  direction={sortBy === 'dap' ? sortOrder : 'asc'}
                  onClick={() => handleSortRequest('dap')}
                >
                  DAP (cm)
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'volume'}
                  direction={sortBy === 'volume' ? sortOrder : 'asc'}
                  onClick={() => handleSortRequest('volume')}
                >
                  Volume (m³)
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'height'}
                  direction={sortBy === 'height' ? sortOrder : 'asc'}
                  onClick={() => handleSortRequest('height')}
                >
                  Altura (m)
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingTrees ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                  <Typography color="textSecondary" mt={1}>
                    Carregando árvores...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedTrees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    Nenhuma árvore cadastrada
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTrees.map(tree => (
                <TableRow key={tree.id} hover>
                  <TableCell fontWeight="bold">{tree.number ?? '-'}</TableCell>
                  <TableCell>{tree.specieName}</TableCell>
                  <TableCell>{tree.popularName || '-'}</TableCell>
                  <TableCell>{tree.cap ? parseFloat(tree.cap).toFixed(2) : '-'} cm</TableCell>
                  <TableCell>{tree.dap ? parseFloat(tree.dap).toFixed(2) : '-'} cm</TableCell>
                  <TableCell>{tree.volume ? parseFloat(tree.volume).toFixed(2) : '-'} m³</TableCell>
                  <TableCell>{tree.height ? parseFloat(tree.height).toFixed(2) : '-'} m</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEdit(tree)}
                      title="Editar"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    {tree.classification === 'Árvore Caída' && (
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleGenerateDocument(tree)}
                        title="Gerar Documento"
                      >
                        <Description fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredAndSortedTrees.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Linhas por página"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />

      <Dialog open={openCreateInventory} onClose={() => setOpenCreateInventory(false)} fullWidth maxWidth="sm">
        <DialogTitle>Criar Inventário</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Nenhum inventário encontrado para esta propriedade. Crie um novo período de inventário.
          </Typography>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Data de Início"
              type="date"
              value={inventoryForm.startDate}
              onChange={(e) => setInventoryForm({ ...inventoryForm, startDate: e.target.value })}
              helperText="Selecione a data de início"
            />
            <TextField
              label="Data de Fim"
              type="date"
              value={inventoryForm.endDate}
              onChange={(e) => setInventoryForm({ ...inventoryForm, endDate: e.target.value })}
              helperText="Selecione a data de fim"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateInventory(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateInventory}>Criar Inventário</Button>
        </DialogActions>
      </Dialog>


      <Dialog open={openDocDialog} onClose={() => setOpenDocDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Documento Gerado (IA)
          <IconButton
            onClick={() => {
              navigator.clipboard.writeText(generatedDoc);
              alert("Texto copiado!");
            }}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <ContentCopy />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDoc ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box data-color-mode="light">
              <MDEditor.Markdown source={generatedDoc} style={{ whiteSpace: 'pre-wrap' }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDocDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};
