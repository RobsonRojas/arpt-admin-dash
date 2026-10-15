import React, { useState, useEffect } from 'react';
import { Box, Typography, Drawer, IconButton, Tabs, Tab, List, ListItem, ListItemText, Divider, Button, Tooltip, Chip, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Close, Description, History, VerifiedUser, Token } from '@mui/icons-material';
import { MapEmbed } from '../../components/MapEmbed';
import { StatusChip } from '../../components/StatusChip';
import { ProjectProducts } from '../../components/modules/project_tabs/ProjectProducts';
import { ProjectDocs } from '../../components/modules/project_tabs/ProjectDocs';
import { ProjectIncidents } from '../../components/modules/project_tabs/ProjectIncidents';
import { ProjectTeam } from '../../components/modules/project_tabs/ProjectTeam';
import { CampaignAssistant } from '../../components/CampaignAssistant';
import { ProjectSpends } from '../../components/modules/project_tabs/ProjectSpends';
import TokenHistoryModal from '../../components/TokenHistoryModal';
import { api } from '../../services/api';

export const ProjectDetailsDrawer = ({ 
  selectedProject, 
  onClose, 
  tabValue, 
  handleTabChange, 
  getProjectImage,
  onGenerateLicensingDoc 
}) => {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Blockchain token status
  const [hasBlockchainToken, setHasBlockchainToken] = useState(null);
  const [loadingTokenStatus, setLoadingTokenStatus] = useState(false);
  const [tokenQueued, setTokenQueued] = useState(false);
  const [triggeringToken, setTriggeringToken] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  useEffect(() => {
    if (!selectedProject?.id) {
      setHasBlockchainToken(null);
      setTokenQueued(false);
      return;
    }

    let active = true;
    setTokenQueued(false);
    setLoadingTokenStatus(true);

    api.get(`/admin/manejo/${selectedProject.id}`)
      .then((response) => {
        if (!active) return;
        const data = response.data;
        const projectStatus = Array.isArray(data) ? data[0] : data;
        setHasBlockchainToken(Boolean(projectStatus?.hasBlockchainToken));
      })
      .catch(() => {
        if (!active) return;
        // Em caso de erro tratamos como desconhecido para não exibir o botão indevidamente.
        setHasBlockchainToken(null);
      })
      .finally(() => {
        if (active) setLoadingTokenStatus(false);
      });

    return () => { active = false; };
  }, [selectedProject?.id]);

  const handleTriggerToken = async () => {
    if (!selectedProject?.id) return;
    setTriggeringToken(true);
    try {
      await api.post(`/admin/manejo/${selectedProject.id}/trigger-blockchain-token`);
      setTokenQueued(true);
      setSnackbar({ open: true, message: 'Criação do token na blockchain enfileirada com sucesso.', severity: 'success' });
    } catch (error) {
      const message = error?.response?.data?.error || 'Erro ao enfileirar a criação do token na blockchain.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setTriggeringToken(false);
    }
  };

  return (
    <>
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
            <Box>
              <Tooltip title="Histórico da Blockchain (Manejo)">
                <IconButton onClick={() => setHistoryModalOpen(true)} sx={{ color: 'white' }}>
                  <History />
                </IconButton>
              </Tooltip>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
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
            <Tab label="Custos & Despesas" data-testid="despesas-tab" />
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
                  <Divider />
                  <ListItem disableGutters>
                    <ListItemText
                      primary="Token na Blockchain"
                      secondary={
                        loadingTokenStatus ? (
                          <CircularProgress size={16} />
                        ) : hasBlockchainToken ? (
                          <Chip
                            size="small"
                            color="success"
                            icon={<VerifiedUser />}
                            label="Registrado"
                          />
                        ) : tokenQueued ? (
                          <Chip
                            size="small"
                            color="info"
                            icon={<Token />}
                            label="Criação enfileirada"
                          />
                        ) : (
                          <Chip
                            size="small"
                            color="warning"
                            icon={<Token />}
                            label="Não registrado"
                          />
                        )
                      }
                    />
                  </ListItem>
                </List>

                {hasBlockchainToken === false && !tokenQueued && (
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    sx={{ mt: 2 }}
                    startIcon={triggeringToken ? <CircularProgress size={16} color="inherit" /> : <Token />}
                    disabled={triggeringToken}
                    onClick={handleTriggerToken}
                  >
                    {triggeringToken ? 'Enfileirando...' : 'Disparar Criação de Token'}
                  </Button>
                )}

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

            {/* TAB 6 - Custos & Despesas */}
            {tabValue === 6 && (
              <ProjectSpends projectId={selectedProject.id} />
            )}
          </Box>
        </Box>
      )}
    </Drawer>

    {selectedProject && (
      <TokenHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        tokenType="manejo"
        tokenId={selectedProject.id}
      />
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
    </>
  );
};
