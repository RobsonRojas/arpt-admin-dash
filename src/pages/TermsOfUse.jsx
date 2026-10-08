import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Modal, TextField, 
  IconButton, Alert, Snackbar, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import CloseIcon from '@mui/material/Icon';
import MDEditor from '@uiw/react-md-editor';
import { api } from '../services/api';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  height: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
};

export const TermsOfUse = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit / Create Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null); // null means creating new
  const [content, setContent] = useState('');
  const [basedOnId, setBasedOnId] = useState(''); // for creating new
  
  // Read-only modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingTerm, setViewingTerm] = useState(null);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/terms/admin/list');
      setTerms(res.data.terms);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: 'Erro ao carregar termos', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleOpenCreate = () => {
    setEditingTerm(null);
    const latestPublished = terms.find(t => t.status === 'published');
    setBasedOnId(latestPublished ? latestPublished.id : '');
    setContent(latestPublished ? latestPublished.content_md : '');
    setModalOpen(true);
  };

  const handleOpenEdit = (term) => {
    setEditingTerm(term);
    setContent(term.content_md);
    setModalOpen(true);
  };

  const handleOpenView = (term) => {
    setViewingTerm(term);
    setViewModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setViewModalOpen(false);
    setEditingTerm(null);
    setViewingTerm(null);
  };

  const handleSaveDraft = async () => {
    try {
      if (editingTerm) {
        await api.put(`/terms/admin/${editingTerm.id}`, { content_md: content });
      } else {
        await api.post('/terms/admin', { content_md: content, based_on_id: basedOnId || undefined });
      }
      setSnack({ open: true, message: 'Rascunho salvo!', severity: 'success' });
      fetchTerms();
      handleClose();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: 'Erro ao salvar rascunho', severity: 'error' });
    }
  };

  const handlePublish = async (id) => {
    if (!window.confirm("Atenção! Ao publicar, esta versão passará a ser a vigente e não poderá mais ser alterada. Deseja continuar?")) return;
    try {
      await api.post(`/terms/admin/${id}/publish`);
      setSnack({ open: true, message: 'Termo publicado com sucesso!', severity: 'success' });
      fetchTerms();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: 'Erro ao publicar termo', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Termo de Uso</Typography>
        <Button variant="contained" color="primary" onClick={handleOpenCreate}>
          Criar Nova Versão
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Versão</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data de Criação</TableCell>
              <TableCell>Data de Publicação</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {terms.map((term) => (
              <TableRow key={term.id}>
                <TableCell>{term.version}</TableCell>
                <TableCell>
                  <Chip 
                    label={term.status === 'published' ? 'Publicado' : 'Rascunho'} 
                    color={term.status === 'published' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>{new Date(term.created_at).toLocaleString()}</TableCell>
                <TableCell>{term.published_at ? new Date(term.published_at).toLocaleString() : '-'}</TableCell>
                <TableCell>
                  {term.status === 'published' ? (
                    <Button size="small" onClick={() => handleOpenView(term)}>Ver Detalhes</Button>
                  ) : (
                    <>
                      <Button size="small" onClick={() => handleOpenEdit(term)}>Editar</Button>
                      <Button size="small" color="success" onClick={() => handlePublish(term.id)}>Publicar</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit/Create Modal */}
      <Modal open={modalOpen} onClose={handleClose}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>
            {editingTerm ? `Editar Rascunho - ${editingTerm.version}` : 'Criar Nova Versão'}
          </Typography>
          
          {!editingTerm && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Basear-se em</InputLabel>
              <Select
                value={basedOnId}
                label="Basear-se em"
                onChange={(e) => {
                  setBasedOnId(e.target.value);
                  const baseTerm = terms.find(t => t.id === e.target.value);
                  if (baseTerm) setContent(baseTerm.content_md);
                  else setContent('');
                }}
              >
                <MenuItem value=""><em>Nenhum (Começar do zero)</em></MenuItem>
                {terms.filter(t => t.status === 'published').map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.version} (Publicado em {new Date(t.published_at).toLocaleDateString()})</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
            <MDEditor
              value={content}
              onChange={setContent}
              height="100%"
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleClose} variant="outlined">Cancelar</Button>
            <Button onClick={handleSaveDraft} variant="contained" color="primary">Salvar Rascunho</Button>
          </Box>
        </Box>
      </Modal>

      {/* View Modal */}
      <Modal open={viewModalOpen} onClose={handleClose}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>
            Termo de Uso - {viewingTerm?.version}
          </Typography>
          <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
            <MDEditor.Markdown source={viewingTerm?.content_md || ''} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleClose} variant="outlined">Fechar</Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar 
        open={snack.open} 
        autoHideDuration={6000} 
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
