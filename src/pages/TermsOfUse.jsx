import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Modal, TextField, 
  Alert, Snackbar, MenuItem, Select, FormControl, InputLabel, Tabs, Tab, FormControlLabel, Checkbox
} from '@mui/material';
import MDEditor from '@uiw/react-md-editor';
import { api } from '../services/api';
import { AUDIENCES, PENDING_AUDIENCES, audienceLabel, currentTerm, draftPayload, pendingName, publishBlockers, publishWarning, termsOf } from '../utils/terms';

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
  const [audienceTab, setAudienceTab] = useState(0); // público mostrado e público do novo termo
  const [contentEn, setContentEn] = useState('');
  const [clauseFreight, setClauseFreight] = useState(false);
  const [editorLang, setEditorLang] = useState('pt');
  const [pending, setPending] = useState(null); // { term, pendentes } do público da aba (produtor/dropshipper)
  const audience = AUDIENCES[audienceTab];
  const visibleTerms = termsOf(terms, audience);
  
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

  // Quem ainda não aceitou a versão vigente (só produtor e dropshipper têm essa lista).
  useEffect(() => {
    setPending(null);
    if (!PENDING_AUDIENCES.includes(audience)) return;
    let cancelled = false;
    api.get('/terms/admin/pending', { params: { audience } })
      .then((res) => { if (!cancelled) setPending(res.data); })
      .catch(() => { if (!cancelled) setPending({ term: null, pendentes: [], erro: true }); });
    return () => { cancelled = true; };
  }, [audience, terms]);

  const handleOpenCreate = () => {
    setEditingTerm(null);
    const latestPublished = currentTerm(terms, audience);
    setBasedOnId(latestPublished ? latestPublished.id : '');
    setContent(latestPublished ? latestPublished.content_md : '');
    setContentEn(latestPublished?.content_md_en ?? '');
    setClauseFreight(!!latestPublished?.contem_clausula_frete);
    setEditorLang('pt');
    setModalOpen(true);
  };

  const handleOpenEdit = (term) => {
    setEditingTerm(term);
    setContent(term.content_md);
    setContentEn(term.content_md_en ?? '');
    setClauseFreight(!!term.contem_clausula_frete);
    setEditorLang('pt');
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
      const payload = draftPayload({ content, contentEn, audience: editingTerm ? (editingTerm.audience ?? 'GERAL') : audience, clauseFreight, basedOnId: editingTerm ? undefined : basedOnId });
      if (editingTerm) {
        await api.put(`/terms/admin/${editingTerm.id}`, payload);
      } else {
        await api.post('/terms/admin', payload);
      }
      setSnack({ open: true, message: 'Rascunho salvo!', severity: 'success' });
      fetchTerms();
      handleClose();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: 'Erro ao salvar rascunho', severity: 'error' });
    }
  };

  const handlePublish = async (term) => {
    const blockers = publishBlockers(term);
    if (blockers.length) {
      setSnack({ open: true, message: blockers.join(' '), severity: 'error' });
      return;
    }
    if (!window.confirm(`Atenção! ${publishWarning(term)} Deseja continuar?`)) return;
    try {
      await api.post(`/terms/admin/${term.id}/publish`, { contem_clausula_frete: !!term.contem_clausula_frete });
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
        <Typography variant="h4">Termos de Uso</Typography>
        <Button variant="contained" color="primary" onClick={handleOpenCreate}>
          Criar Nova Versão
        </Button>
      </Box>

      <Tabs value={audienceTab} onChange={(e, v) => setAudienceTab(v)} sx={{ mb: 2 }}>
        {AUDIENCES.map((a) => <Tab key={a} label={audienceLabel(a)} />)}
      </Tabs>

      {PENDING_AUDIENCES.includes(audience) && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Aceite da versão vigente{pending?.term ? ` (${pending.term.version})` : ''}</Typography>
          {pending === null && <Typography variant="body2" color="textSecondary">Carregando…</Typography>}
          {pending?.erro && <Alert severity="error">Não foi possível carregar quem ainda não aceitou.</Alert>}
          {pending && !pending.erro && !pending.term && <Typography variant="body2" color="textSecondary">Nenhum termo publicado para este público: nenhum aceite é exigido.</Typography>}
          {pending?.term && pending.pendentes.length === 0 && <Typography variant="body2" color="success.main">Todos aceitaram a versão vigente.</Typography>}
          {pending?.term && pending.pendentes.length > 0 && (
            <>
              <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                {pending.pendentes.length} ainda não aceitou{pending.pendentes.length > 1 ? 'aram' : ''}. {audience === 'PRODUTOR' ? 'Sem o aceite, não conseguem aceitar novos pedidos.' : 'Sem o aceite, não criam lojas nem alocam produtos.'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {pending.pendentes.map((p) => <Chip key={p.user_id} size="small" label={pendingName(p)} />)}
              </Box>
            </>
          )}
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Versão</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Inglês</TableCell>
              <TableCell>Cláusula do frete</TableCell>
              <TableCell>Data de Criação</TableCell>
              <TableCell>Data de Publicação</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleTerms.length === 0 && <TableRow><TableCell colSpan={7} align="center">Nenhuma versão para este público</TableCell></TableRow>}
            {visibleTerms.map((term) => (
              <TableRow key={term.id}>
                <TableCell>{term.version}</TableCell>
                <TableCell>
                  <Chip 
                    label={term.status === 'published' ? 'Publicado' : 'Rascunho'} 
                    color={term.status === 'published' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>{term.content_md_en ? 'Sim' : 'Não'}</TableCell>
                <TableCell>{term.contem_clausula_frete ? <Chip label="Contém" color="info" size="small" /> : '—'}</TableCell>
                <TableCell>{new Date(term.created_at).toLocaleString()}</TableCell>
                <TableCell>{term.published_at ? new Date(term.published_at).toLocaleString() : '-'}</TableCell>
                <TableCell>
                  {term.status === 'published' ? (
                    <Button size="small" onClick={() => handleOpenView(term)}>Ver Detalhes</Button>
                  ) : (
                    <>
                      <Button size="small" onClick={() => handleOpenEdit(term)}>Editar</Button>
                      <Button size="small" color="success" onClick={() => handlePublish(term)}>Publicar</Button>
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
            {editingTerm ? `Editar Rascunho - ${editingTerm.version}` : 'Criar Nova Versão'} · {audienceLabel(editingTerm ? (editingTerm.audience ?? 'GERAL') : audience)}
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
                  setContent(baseTerm ? baseTerm.content_md : '');
                  setContentEn(baseTerm?.content_md_en ?? '');
                }}
              >
                <MenuItem value=""><em>Nenhum (Começar do zero)</em></MenuItem>
                {visibleTerms.filter(t => t.status === 'published').map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.version} (Publicado em {new Date(t.published_at).toLocaleDateString()})</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap' }}>
            <Tabs value={editorLang} onChange={(e, v) => setEditorLang(v)}>
              <Tab value="pt" label="Português" />
              <Tab value="en" label={`English${contentEn.trim() ? '' : ' (vazio)'}`} />
            </Tabs>
            {(editingTerm ? (editingTerm.audience ?? 'GERAL') : audience) !== 'GERAL' ? (
              <FormControlLabel
                control={<Checkbox checked={clauseFreight} onChange={(e) => setClauseFreight(e.target.checked)} />}
                label="Este texto contém a cláusula do frete"
              />
            ) : null}
          </Box>
          {clauseFreight && !contentEn.trim() && (
            <Alert severity="warning" sx={{ mb: 1 }}>A marca do frete está ligada: a versão em inglês é obrigatória para publicar.</Alert>
          )}
          <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
            {editorLang === 'pt'
              ? <MDEditor value={content} onChange={(v) => setContent(v ?? '')} height="100%" />
              : <MDEditor value={contentEn} onChange={(v) => setContentEn(v ?? '')} height="100%" />}
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
            {viewingTerm?.content_md_en && (
              <>
                <Typography variant="h6" sx={{ mt: 4 }}>English</Typography>
                <MDEditor.Markdown source={viewingTerm.content_md_en} />
              </>
            )}
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
