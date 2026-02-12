import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Toolbar, TextField, MenuItem, Button,
  Table, TableContainer, TableHead, TableRow, TableCell,
  TableBody, Typography, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Drawer, List, ListItem, ListItemText, Divider,
  Tabs, Tab, Avatar
} from '@mui/material';
import { Search, Add, Edit, Visibility, Close, ContentCopy, Description, Image as ImageIcon, Assessment } from '@mui/icons-material';
import { StatusChip } from '../components/StatusChip';
import { MapEmbed } from '../components/MapEmbed';
import { FieldAppEmbedded } from '../components/FieldAppEmbedded';
import { ProjectProducts } from '../components/modules/project_tabs/ProjectProducts';
import { ProjectDocs } from '../components/modules/project_tabs/ProjectDocs';
import { ProjectIncidents } from '../components/modules/project_tabs/ProjectIncidents';
import { CampaignAssistant } from '../components/CampaignAssistant';
import { RevenueReportDialog } from '../components/modules/RevenueReportDialog';

import { STATUS_PROJETO } from '../constants';
import { useAdmin } from '../contexts/AdminContext';
import { generateDocument } from '../services/gemini';
import { CircularProgress } from '@mui/material';
import MDEditor from '@uiw/react-md-editor';

export const Projects = () => {
  // Skip link for screen readers
  const skipRef = useRef(null);
  const handleSkip = (e) => {
    e.preventDefault();
    if (skipRef.current) skipRef.current.focus();
  };
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
    urlMidiasFiles,
    properties
  } = useAdmin();

  const filteredProjects = getFilteredProjects();

  // Document Generation State
  const [openDocDialog, setOpenDocDialog] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(false);

  // Tabs State
  const [tabValue, setTabValue] = useState(0);

  // Revenue Report State
  const [reportProject, setReportProject] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  const getProjectImage = (project) => {
    if (project.foto_url) return project.foto_url;
    if (project.image_internal_path) return `${urlMidiasFiles}${project.image_internal_path}`;
    return null;
  };

  return (
    <>
      <a href="#main-content" onClick={handleSkip} ref={skipRef} style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>Skip to main content</a>
      <Box sx={{ animation: 'fadeIn 0.5s' }}>
        <Paper sx={{ width: '100%', mb: 2, p: 2 }} id="main-content">
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

        <Box>
          {/* Desktop Table View */}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', display: { xs: 'none', md: 'block' } }}>
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
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          src={getProjectImage(p)}
                          variant="rounded"
                        >
                          <ImageIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {p.descricao}
                          </Typography>
                          <Typography variant="caption">{p.municipio} - {p.estado}</Typography>
                        </Box>
                      </Box>
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
                        aria-label="Editar projeto"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setReportProject(p)}
                        title="Relatório de Receitas"
                        aria-label="Relatório de Receitas"
                      >
                        <Assessment />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => { setSelectedProject(p); setTabValue(0); }}
                        title="Visualizar"
                        aria-label="Visualizar projeto"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card View */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            {filteredProjects.map((p) => (
              <Paper key={p.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box display="flex" gap={2} alignItems="center">
                  <Avatar
                    src={getProjectImage(p)}
                    variant="rounded"
                    sx={{ width: 60, height: 60 }}
                  >
                    <ImageIcon />
                  </Avatar>
                  <Box flex={1}>
                    <Typography fontWeight="bold" variant="subtitle1">{p.descricao}</Typography>
                    <Typography variant="body2" color="textSecondary">{p.municipio} - {p.estado}</Typography>
                  </Box>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                  <StatusChip status={p.desc_status} />
                  <Typography variant="body2" fontWeight="bold">
                    R$ {parseFloat(p.custo_operacional).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                  <Button size="small" startIcon={<Visibility />} onClick={() => { setSelectedProject(p); setTabValue(0); }}>
                    Ver Detalhes
                  </Button>
                  <Button size="small" startIcon={<Edit />} onClick={() => handleEditProject(p)}>
                    Editar
                  </Button>
                </Box>
              </Paper>
            ))}
            {filteredProjects.length === 0 && (
              <Typography align="center" color="textSecondary">Nenhum projeto encontrado</Typography>
            )}
          </Box>
        </Box>

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
              properties={properties}
            />
          </DialogContent>
        </Dialog>

        {/* Drawer Detalhes Projeto */}
        <Drawer
          anchor="right"
          open={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          PaperProps={{ sx: { width: { xs: '100%', md: 600 } } }}
        >
          {selectedProject && (
            <Box height="100%" display="flex" flexDirection="column">
              <Box p={2} bgcolor="primary.main" color="white">
                <Typography variant="h6">{selectedProject.descricao}</Typography>
              </Box>

              {/* Project Image Header */}
              {getProjectImage(selectedProject) && (
                <Box
                  component="img"
                  src={getProjectImage(selectedProject)}
                  alt={selectedProject.descricao}
                  onError={(e) => { e.target.style.display = 'none'; }}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover'
                  }}
                />
              )}

              <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" indicatorColor="secondary" textColor="inherit">
                <Tab label="Visão Geral" />
                <Tab label="Produtos" />
                <Tab label="Documentos" />
                <Tab label="Incidentes" />
                <Tab label="Estratégia" />
              </Tabs>

              <Box flexGrow={1} p={3} overflow="auto">
                {/* TAB 0 - Visão Geral */}
                {tabValue === 0 && (
                  <>
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
                            <StatusChip label={selectedProject.auditoria?.risco || 'N/A'} size="small" />
                          }
                        />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>Documentação (IA)</Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Description />}
                      onClick={() => handleGenerateLicensingDoc(selectedProject)}
                    >
                      Gerar Documentos de Licenciamento
                    </Button>
                  </>
                )}

                {/* TAB 1 - Produtos */}
                {tabValue === 1 && (
                  <ProjectProducts projectId={selectedProject.id} />
                )}

                {/* TAB 2 - Documentos */}
                {tabValue === 2 && (
                  <ProjectDocs projectId={selectedProject.id} />
                )}

                {/* TAB 3 - Incidentes */}
                {tabValue === 3 && (
                  <ProjectIncidents projectId={selectedProject.id} />
                )}

                {/* TAB 4 - Estratégia */}
                {tabValue === 4 && (
                  <CampaignAssistant project={selectedProject} />
                )}
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

        <RevenueReportDialog
          open={!!reportProject}
          onClose={() => setReportProject(null)}
          project={reportProject}
        />
      </Box>
    </>
  );
};
