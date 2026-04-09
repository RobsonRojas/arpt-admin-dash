import React, { useState, useRef } from 'react';
import {
  Box, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, CircularProgress
} from '@mui/material';
import { Close, ContentCopy } from '@mui/icons-material';
import { FieldAppEmbedded } from '../components/FieldAppEmbedded';
import { RevenueReportDialog } from '../components/modules/RevenueReportDialog';
import { CarbonReportDialog } from '../components/modules/CarbonReportDialog';
import { ProjectToolbar } from './projects/ProjectToolbar';
import { ProjectTable } from './projects/ProjectTable';
import { ProjectMobileCards } from './projects/ProjectMobileCards';
import { ProjectDetailsDrawer } from './projects/ProjectDetailsDrawer';

import { useAdmin } from '../contexts/AdminContext';
import { generateDocument } from '../services/gemini';
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
    urlMidiasFiles,
    properties,
    statuses
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
  const [carbonReportProject, setCarbonReportProject] = useState(null);

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
      
      <Box sx={{ animation: 'fadeIn 0.5s' }} id="main-content">
        <ProjectToolbar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          onNewProject={() => setOpenCadastro(true)}
        />

        <Box>
          <ProjectTable 
            projects={filteredProjects}
            getProjectImage={getProjectImage}
            onEdit={handleEditProject}
            onReport={setReportProject}
            onCarbonReport={setCarbonReportProject}
            onSelect={(p) => { setSelectedProject(p); setTabValue(0); }}
          />

          <ProjectMobileCards 
            projects={filteredProjects}
            getProjectImage={getProjectImage}
            onEdit={handleEditProject}
            onReport={setReportProject}
            onCarbonReport={setCarbonReportProject}
            onSelect={(p) => { setSelectedProject(p); setTabValue(0); }}
          />
        </Box>

        {/* Modal Wizard de Cadastro/Edição */}
        <Dialog 
            open={openCadastro} 
            onClose={handleCloseCadastro} 
            fullWidth 
            maxWidth="md"
            fullScreen={{ xs: true, sm: false }}
        >
          <DialogTitle
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: { xs: 1.5, sm: 2 }
            }}
          >
            {editingProject ? `Editar: ${editingProject.descricao}` : "Novo Cadastro de Manejo"}
            <IconButton onClick={handleCloseCadastro} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ mt: 2, p: { xs: 1, sm: 3 } }}>
            <FieldAppEmbedded
              onClose={handleCloseCadastro}
              onSave={handleSaveProject}
              initialData={editingProject}
              properties={properties}
              statuses={statuses}
            />
          </DialogContent>
        </Dialog>

        {/* Drawer Detalhes Projeto */}
        <ProjectDetailsDrawer 
          selectedProject={selectedProject}
          onClose={() => setSelectedProject(null)}
          tabValue={tabValue}
          handleTabChange={handleTabChange}
          getProjectImage={getProjectImage}
          onGenerateLicensingDoc={handleGenerateLicensingDoc}
        />

        {/* Modal IA Docs */}
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
        <CarbonReportDialog
          open={!!carbonReportProject}
          onClose={() => setCarbonReportProject(null)}
          project={carbonReportProject}
        />
      </Box>
    </>
  );
};
