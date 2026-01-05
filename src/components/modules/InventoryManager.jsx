import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableContainer, TableHead, TableRow,
  TableCell, TableBody, IconButton, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField
} from '@mui/material';
import { Edit, Add, ArrowBack, Park } from '@mui/icons-material';
import { TreeForm } from './TreeForm';
import { useAdmin } from '../../contexts/AdminContext';

export const InventoryManager = ({ property, onClose }) => {
  const [trees, setTrees] = useState([]);
  const [viewState, setViewState] = useState("list");
  const [editingTree, setEditingTree] = useState(null);
  const {
      getAllInventoryByPropertyId,
      createInventory,
      createTree,
  } = useAdmin();

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

    // Gera número automático se não fornecido
    const normalizedTrees = Array.isArray(trees) ? trees : [];
    const autoNumber = treeData.number 
      ? Number(treeData.number) 
      : (normalizedTrees.length > 0 ? Math.max(...normalizedTrees.map(t => t.number || 0)) + 1 : 1);

    // Normaliza payload para API
    const nowIso = new Date().toISOString();
    const payload = {
      ...treeData,
      propertyId: Number(property.id),
      inventoryId: currentInventoryId,
      number: autoNumber,
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

    const created = await createTree(currentInventoryId, payload);

    if (created) {
      await loadTrees({ suppressCreatePrompt: true });
      setViewState("list");
      return;
    }

    // fallback otimista local
    const newTree = {
      ...payload,
      id: Date.now(),
    };
    setTrees([newTree, ...trees]);
    setViewState("list");
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
      setTrees(trees.filter(t => t.id !== treeId));
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

  const loadTrees = async ({ suppressCreatePrompt = false } = {}) => {
    try {
      const response = await getAllInventoryByPropertyId(property.id);

      // Se não houver inventário na API, abre modal
      if (!response) {
        setTrees([]);
        if (!suppressCreatePrompt) setOpenCreateInventory(true);
        return;
      }

      const inventories = response?.inventories;
      setTrees(inventories);
      // Descobrir o inventoryId
      const inferredInventoryId = response?.inventoryId;
      setCurrentInventoryId(inferredInventoryId);
      // Inventário existe: mantém modal fechado mesmo com 0 árvores
      setOpenCreateInventory(false);
    } catch (error) {
      console.error("Erro ao buscar inventário:", error);
      setTrees([]);
      if (!suppressCreatePrompt) setOpenCreateInventory(true);
    }
  };

  useEffect(() => {
    loadTrees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id]);

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
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <Park color="primary" /> Inventário de Árvores
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Propriedade: {property.name || property.proprietario}
          </Typography>
        </Box>
        <Box>
          <Button variant="outlined" color="inherit" onClick={onClose} sx={{ mr: 1 }}>
            Fechar
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleNew}>
            Cadastrar Árvore
          </Button>
        </Box>
      </Paper>

      {/* TABELA */}
      <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              <TableCell>Nº Placa</TableCell>
              <TableCell>Espécie</TableCell>
              <TableCell>DAP (cm)</TableCell>
              <TableCell>Volume (m³)</TableCell>
              <TableCell>Altura (m)</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!trees || trees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    Nenhuma árvore cadastrada
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              trees.map(tree => (
                <TableRow key={tree.id} hover>
                  <TableCell fontWeight="bold">{tree.number ?? '-'}</TableCell>
                  <TableCell>{tree.specieName}</TableCell>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
    </Box>
  );
};
