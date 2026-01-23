import React from 'react';
import {
  Box, Paper, Toolbar, TextField, MenuItem, Button,
  Table, TableContainer, TableHead, TableRow, TableCell,
  TableBody, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Drawer, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { Search, Add, Edit, Visibility, Close } from '@mui/icons-material';
import { StatusChip, MapEmbed } from '../components';
import { FieldAppEmbedded } from '../components/FieldAppEmbedded';

import { STATUS_PROJETO } from '../constants';
import { useAdmin } from '../contexts/AdminContext';
import { generateDocument } from '../services/gemini';
import { CircularProgress } from '@mui/material';
import MDEditor from '@uiw/react-md-editor';
import { ContentCopy, Description } from '@mui/icons-material';
import { useState } from 'react';

export const Projects = () => {
  const {
    getFilteredProjects,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    openCadastro,
    setOpenCadastro,
    editingProject,
    handleEditProject,
    handleSaveProject,
    handleCloseCadastro,
    selectedProject,
    setSelectedProject,
    projects,
  } = useAdmin();



  const filteredProjects = getFilteredProjects();

  // Document Generation State
  const [openDocDialog, setOpenDocDialog] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(false);

  const handleGenerateLicensingDoc = async (project) => {
    setLoadingDoc(true);
    setOpenDocDialog(true);
    setGeneratedDoc("Gerando documentos de licenciamento, por favor aguarde...");

    try {
      const doc = await generateDocument('licensing', project);
      setGeneratedDoc(doc);
    } catch (error) {
      setGeneratedDoc("Erro ao gerar documento. Tente novamente.");
    } finally {
      setLoadingDoc(false);
    }
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Toolbar sx={{ pl: 0, pr: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Buscar projeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            select
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="Todos">Todos</MenuItem>
            {STATUS_PROJETO.map(status => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCadastro(true)}
          >
            Novo Manejo
          </Button>
        </Toolbar>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Projeto</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Custo</TableCell>
              <TableCell align="right">Ação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {p.descricao}
                  </Typography>
                  <Typography variant="caption">{p.municipio} - {p.estado}</Typography>
                </TableCell>
                <TableCell>
                  <StatusChip status={p.desc_status} />
                </TableCell>
                <TableCell>
                  R$ {parseFloat(p.custo_operacional).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleEditProject(p)}
                    title="Editar"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedProject(p)}
                    title="Visualizar"
                  >
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Wizard de Cadastro/Edição */}
      <Dialog open={openCadastro} onClose={handleCloseCadastro} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {editingProject ? `Editar: ${editingProject.descricao}` : "Novo Cadastro de Manejo"}
          <IconButton onClick={handleCloseCadastro} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <FieldAppEmbedded
            onClose={handleCloseCadastro}
            onSave={handleSaveProject}
            initialData={editingProject}
          />
        </DialogContent>
      </Dialog>

      {/* Drawer Detalhes Projeto */}
      <Drawer
        anchor="right"
        open={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        PaperProps={{ sx: { width: { xs: '100%', md: 500 } } }}
      >
        {selectedProject && (
          <Box p={3} display="flex" flexDirection="column" height="100%">
            <Typography variant="h6">{selectedProject.descricao}</Typography>
            <Divider sx={{ my: 2 }} />
            <Box flexGrow={1}>
              <MapEmbed
                lat={selectedProject.latitude || -3.0}
                lng={selectedProject.longitude || -60.0}
              />
              <List>
                <ListItem>
                  <ListItemText
                    primary="Proponente"
                    secondary={selectedProject.proponente}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Área"
                    secondary={`${selectedProject.tamanho} ${selectedProject.unidade_medida}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Risco Auditoria"
                    secondary={
                      <StatusChip label={selectedProject.auditoria.risco} size="small" />
                    }
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Documentação</Typography>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Description />}
                onClick={() => handleGenerateLicensingDoc(selectedProject)}
              >
                Gerar Documentos de Licenciamento
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>


      <Dialog open={openDocDialog} onClose={() => setOpenDocDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Documento de Licenciamento (IA)
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
