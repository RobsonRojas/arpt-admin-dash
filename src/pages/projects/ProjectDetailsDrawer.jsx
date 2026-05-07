import React from 'react';
import { Box, Typography, Drawer, IconButton, Tabs, Tab, List, ListItem, ListItemText, Divider, Button } from '@mui/material';
import { Close, Description } from '@mui/icons-material';
import { MapEmbed } from '../../components/MapEmbed';
import { StatusChip } from '../../components/StatusChip';
import { ProjectProducts } from '../../components/modules/project_tabs/ProjectProducts';
import { ProjectDocs } from '../../components/modules/project_tabs/ProjectDocs';
import { ProjectIncidents } from '../../components/modules/project_tabs/ProjectIncidents';
import { ProjectTeam } from '../../components/modules/project_tabs/ProjectTeam';
import { CampaignAssistant } from '../../components/CampaignAssistant';

export const ProjectDetailsDrawer = ({ 
  selectedProject, 
  onClose, 
  tabValue, 
  handleTabChange, 
  getProjectImage,
  onGenerateLicensingDoc 
}) => {
  return (
    <Drawer
      anchor="right"
      open={Boolean(selectedProject)}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', md: 600 } } }}
    >
      {selectedProject && (
        <Box height="100%" display="flex" flexDirection="column">
          <Box p={2} bgcolor="primary.main" color="white" display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{selectedProject.descricao}</Typography>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
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
                height: { xs: 150, md: 200 },
                objectFit: 'cover'
              }}
            />
          )}

          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable" 
            scrollButtons="auto" 
            indicatorColor="secondary" 
            textColor="inherit"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Visão Geral" />
            <Tab label="Produtos" />
            <Tab label="Documentos" />
            <Tab label="Incidentes" />
            <Tab label="Equipe" />
            <Tab label="Estratégia" />
          </Tabs>

          <Box flexGrow={1} p={{ xs: 2, md: 3 }} overflow="auto">
            {/* TAB 0 - Visão Geral */}
            {tabValue === 0 && (
              <>
                <MapEmbed
                  lat={selectedProject.latitude || -3.0}
                  lng={selectedProject.longitude || -60.0}
                />
                <List sx={{ mt: 2 }}>
                  <ListItem disableGutters>
                    <ListItemText
                      primary="Proponente"
                      secondary={selectedProject.proponente}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters>
                    <ListItemText
                      primary="Área"
                      secondary={`${selectedProject.tamanho} ${selectedProject.unidade_medida}`}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters>
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
                  onClick={() => onGenerateLicensingDoc(selectedProject)}
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

            {/* TAB 4 - Equipe */}
            {tabValue === 4 && (
              <ProjectTeam projectId={selectedProject.id} />
            )}

            {/* TAB 5 - Estratégia */}
            {tabValue === 5 && (
              <CampaignAssistant project={selectedProject} />
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );
};
