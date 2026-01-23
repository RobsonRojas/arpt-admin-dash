import React, { useState } from 'react';
import {
  Box, Typography, Button, Table, TableContainer, TableHead,
  TableRow, TableCell, TableBody, Paper, IconButton, Avatar,
  Chip, Drawer, List, ListItem, ListItemText,
  TextField, MenuItem, DialogActions, DialogContent, DialogTitle, Dialog
} from '@mui/material';
import { AccountBalanceWallet, Visibility, Create, Link as LinkIcon } from '@mui/icons-material';
import { useAdmin } from '../contexts/AdminContext';

export const Sponsors = () => {
  /* Adicione esses imports no topo se não existirem
  import { Create, Share, Link as LinkIcon, Download } from '@mui/icons-material';
  import { TextField, MenuItem, DialogActions, DialogContent, DialogTitle, Dialog, Grid } from '@mui/material';
  */

  const { sponsors, projects } = useAdmin(); // Ensure projects is destructured
  const [openCertDialog, setOpenCertDialog] = useState(false);
  const [certData, setCertData] = useState({
    sponsorName: '',
    projectId: '',
    date: new Date().toISOString()
  });
  const [generatedLink, setGeneratedLink] = useState('');

  const handleGenerateLink = () => {
    if (!certData.sponsorName || !certData.projectId) return;

    const project = projects.find(p => p.id === certData.projectId);

    const payload = {
      sponsorName: certData.sponsorName,
      projectName: project ? project.descricao : "Projeto Arpt",
      date: certData.date
    };

    // Base64 encode
    const encoded = btoa(JSON.stringify(payload));
    const link = `${window.location.origin}/certificate/view?d=${encoded}`;
    setGeneratedLink(link);
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Gestão de Patrocinadores (RWA)
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Create />}
            onClick={() => setOpenCertDialog(true)}
          >
            Gerar Certificado
          </Button>
          <Button variant="contained" startIcon={<AccountBalanceWallet />}>
            Nova Captação
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f9fafb' }}>
            <TableRow>
              <TableCell>Patrocinador</TableCell>
              <TableCell>Nível</TableCell>
              <TableCell>Total Patrocinado</TableCell>
              <TableCell align="right">Ação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sponsors.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Box display="flex" gap={2} alignItems="center">
                    <Avatar>{row.nome[0]}</Avatar>
                    <Box>
                      <Typography fontWeight="bold">{row.nome}</Typography>
                      <Typography variant="caption">{row.tipo}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.nivel}
                    size="small"
                    color={row.nivel === 'Platina' ? 'info' : 'warning'}
                  />
                </TableCell>
                <TableCell>
                  <Typography color="success.main" fontWeight="bold">
                    R$ {row.total_patrocinado.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => setSelectedSponsor(row)}>
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Drawer Detalhes */}
      <Drawer
        anchor="right"
        open={Boolean(selectedSponsor)}
        onClose={() => setSelectedSponsor(null)}
      >
        <Box p={3} width={400}>
          <Typography variant="h6">Detalhes</Typography>
          {selectedSponsor && (
            <List>
              <ListItem>
                <ListItemText
                  primary="Nome"
                  secondary={selectedSponsor.nome}
                />
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>

      {/* Dialog Gerador de Certificado */}
      <Dialog open={openCertDialog} onClose={() => setOpenCertDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gerar Certificado de Patrocínio</DialogTitle>
        <DialogContent>
          <Box mt={1} display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Nome do Patrocinador"
              fullWidth
              value={certData.sponsorName}
              onChange={(e) => setCertData({ ...certData, sponsorName: e.target.value })}
            />

            <TextField
              select
              label="Projeto Patrocinado"
              fullWidth
              value={certData.projectId}
              onChange={(e) => setCertData({ ...certData, projectId: e.target.value })}
            >
              {projects && projects.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.descricao}
                </MenuItem>
              ))}
            </TextField>

            {generatedLink && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f0f0f0' }}>
                <Typography variant="caption" display="block" gutterBottom>Link do Certificado:</Typography>
                <Box display="flex" gap={1} alignItems="center">
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', flexGrow: 1 }}>
                    {generatedLink}
                  </Typography>
                  <IconButton size="small" onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert("Link copiado!");
                  }}>
                    <LinkIcon />
                  </IconButton>
                  <IconButton size="small" href={generatedLink} target="_blank">
                    <Visibility />
                  </IconButton>
                </Box>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenCertDialog(false);
            setGeneratedLink('');
            setCertData({ sponsorName: '', projectId: '', date: new Date().toISOString() });
          }}>
            Fechar
          </Button>
          <Button variant="contained" onClick={handleGenerateLink} disabled={!certData.sponsorName || !certData.projectId}>
            Gerar Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
