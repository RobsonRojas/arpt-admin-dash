import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, 
  Button, Switch, FormControlLabel, Divider, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Download, DeleteForever, Security } from '@mui/icons-material';

export const PrivacySettings = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [consents, setConsents] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchConsents();
  }, []);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/lgpd/consents');
      setConsents(response.data.consents || []);
    } catch (error) {
      console.error('Error fetching consents', error);
    } finally {
      setLoading(false);
    }
  };

  const hasConsent = (type) => {
    const latest = consents.find(c => c.consent_type === type);
    return latest ? latest.granted : false;
  };

  const handleToggleConsent = async (type, currentStatus) => {
    try {
      await api.post('/lgpd/consents', {
        type,
        version: '1.0.0',
        granted: !currentStatus
      });
      fetchConsents();
    } catch (error) {
      console.error('Error updating consent', error);
    }
  };

  const handleRequestExport = async () => {
    setExportLoading(true);
    try {
      await api.post('/lgpd/data-export');
      alert('Solicitação de exportação enviada com sucesso! Você receberá um e-mail em breve.');
    } catch (error) {
      console.error('Error requesting data export', error);
      alert('Erro ao solicitar exportação. Tente novamente mais tarde.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR') return;
    setDeleteLoading(true);
    try {
      await api.post('/lgpd/delete-account');
      setDeleteDialogOpen(false);
      alert('Sua conta foi excluída com sucesso.');
      signOut();
    } catch (error) {
      console.error('Error deleting account', error);
      alert('Erro ao excluir conta.');
      setDeleteLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security color="primary" /> Configurações de Privacidade
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Termos e Políticas (LGPD)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Gerencie seus consentimentos relacionados ao uso da plataforma e processamento de dados.
              </Typography>
              
              {loading ? <CircularProgress /> : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1">Termos de Serviço</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Regras de uso da plataforma.
                      </Typography>
                    </Box>
                    <Switch 
                      checked={hasConsent('TERMS_OF_SERVICE')} 
                      onChange={() => handleToggleConsent('TERMS_OF_SERVICE', hasConsent('TERMS_OF_SERVICE'))} 
                      color="primary" 
                    />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1">Política de Privacidade</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Coleta e processamento de dados pessoais (Obrigatório).
                      </Typography>
                    </Box>
                    <Switch 
                      checked={hasConsent('PRIVACY_POLICY')} 
                      onChange={() => handleToggleConsent('PRIVACY_POLICY', hasConsent('PRIVACY_POLICY'))} 
                      color="primary" 
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Seus Direitos
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Exerça seus direitos garantidos pela Lei Geral de Proteção de Dados (LGPD).
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Exportação de Dados</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Receba uma cópia completa dos seus dados armazenados na plataforma por e-mail.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={exportLoading ? <CircularProgress size={20} /> : <Download />}
                    onClick={handleRequestExport}
                    disabled={exportLoading}
                  >
                    Solicitar Exportação
                  </Button>
                </Box>
                
                <Divider />
                
                <Box>
                  <Typography variant="subtitle1" color="error.main" gutterBottom>Exclusão de Conta</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Apagar permanentemente seus dados pessoais. O histórico de transações financeiras e de manejo florestal será anonimizado.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="error"
                    startIcon={<DeleteForever />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Excluir Minha Conta
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>Atenção: Exclusão Permanente</DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            Você está prestes a excluir sua conta. Esta ação é irreversível e você perderá o acesso à plataforma imediatamente.
          </DialogContentText>
          <DialogContentText paragraph>
            Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo:
          </DialogContentText>
          <TextField
            fullWidth
            variant="outlined"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="EXCLUIR"
            error={deleteConfirmText !== '' && deleteConfirmText !== 'EXCLUIR'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>Cancelar</Button>
          <Button 
            color="error" 
            variant="contained" 
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== 'EXCLUIR' || deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : 'Confirmar Exclusão'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
