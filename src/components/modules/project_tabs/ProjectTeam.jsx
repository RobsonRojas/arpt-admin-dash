import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Alert, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, Avatar
} from '@mui/material';
import { Delete, Edit, PersonAdd, Mail } from '@mui/icons-material';
import { api } from '../../../services/api';

const ROLES = ['owner', 'technician', 'artisan', 'supervisor'];

export const ProjectTeam = ({ projectId }) => {
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dialog states
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('technician');
  const [actionLoading, setActionLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editRole, setEditRole] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        api.get(`/manejos/${projectId}/members`),
        api.get(`/manejos/${projectId}/invitations`)
      ]);
      setMembers(membersRes.data);
      setInvitations(invitationsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erro ao carregar dados da equipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchData();
  }, [projectId]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setActionLoading(true);
    try {
      await api.post(`/manejos/${projectId}/invitations`, {
        email: inviteEmail,
        role: inviteRole
      });
      setInviteOpen(false);
      setInviteEmail('');
      fetchData();
    } catch (err) {
      console.error('Error inviting member:', err);
      alert('Erro ao enviar convite.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Tem certeza que deseja remover este membro?')) return;
    try {
      await api.delete(`/manejos/${projectId}/members/${userId}`);
      fetchData();
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Erro ao remover membro.');
    }
  };

  const handleResendInvite = async (invitationId) => {
    setActionLoading(true);
    try {
      await api.post(`/manejos/${projectId}/invitations/${invitationId}/resend`);
      alert('Convite reenviado com sucesso.');
      fetchData();
    } catch (err) {
      console.error('Error resending invitation:', err);
      alert('Erro ao reenviar convite.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditRole = async () => {
    try {
      await api.patch(`/manejos/${projectId}/members/${selectedMember.id}`, {
        role: editRole
      });
      setEditOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Erro ao atualizar cargo.');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;

  const combinedList = [
    ...members.map(m => ({
      key: `member-${m.id}`,
      type: 'member',
      id: m.id,
      name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email,
      email: m.email,
      role: m.role,
      status: 'active',
      date: m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'
    })),
    ...invitations.map(i => ({
      key: `invite-${i.id}`,
      type: 'invitation',
      id: i.id,
      name: 'Pendente',
      email: i.email,
      role: i.role,
      status: 'pending',
      date: i.expires_at ? `Expira em: ${new Date(i.expires_at).toLocaleDateString()}` : 'N/A'
    }))
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Equipe do Projeto</Typography>
        <Button 
          variant="contained" 
          startIcon={<PersonAdd />} 
          onClick={() => setInviteOpen(true)}
          size="small"
        >
          Convidar
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Membro</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Cargo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Detalhes</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', pr: 3 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {combinedList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="textSecondary">
                    Nenhum membro ou convite pendente.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              combinedList.map((item) => (
                <TableRow key={item.key} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ 
                        bgcolor: item.status === 'active' ? 'primary.light' : 'warning.light',
                        color: item.status === 'active' ? 'primary.contrastText' : 'warning.contrastText',
                        width: 36,
                        height: 36,
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}>
                        {item.status === 'active' ? item.name.charAt(0).toUpperCase() : '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.role.toUpperCase()} 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                      sx={{ fontWeight: 'bold', fontSize: '0.675rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.status === 'active' ? 'ATIVO' : 'PENDENTE'} 
                      size="small"
                      color={item.status === 'active' ? 'success' : 'warning'}
                      sx={{ fontWeight: 'bold', fontSize: '0.675rem', borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">
                      {item.date}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 2 }}>
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                      {item.status === 'active' ? (
                        <>
                          <Tooltip title="Alterar Cargo">
                            <IconButton size="small" onClick={() => {
                              setSelectedMember(members.find(m => m.id === item.id));
                              setEditRole(item.role);
                              setEditOpen(true);
                            }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remover Membro">
                            <IconButton size="small" color="error" onClick={() => handleRemove(item.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip title="Reenviar Convite">
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleResendInvite(item.id)} 
                            disabled={actionLoading}
                          >
                            <Mail fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Convidar para o Projeto</DialogTitle>
        <DialogContent>
          <Box pt={1} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="E-mail"
              type="email"
              fullWidth
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="exemplo@email.com"
              autoFocus
            />
            <FormControl fullWidth>
              <InputLabel>Cargo</InputLabel>
              <Select
                value={inviteRole}
                label="Cargo"
                onChange={(e) => setInviteRole(e.target.value)}
              >
                {ROLES.map(role => (
                  <MenuItem key={role} value={role}>{role.toUpperCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleInvite} 
            variant="contained" 
            disabled={!inviteEmail || actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <Mail />}
          >
            Enviar Convite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Alterar Cargo</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <FormControl fullWidth>
              <InputLabel>Cargo</InputLabel>
              <Select
                value={editRole}
                label="Cargo"
                onChange={(e) => setEditRole(e.target.value)}
              >
                {ROLES.map(role => (
                  <MenuItem key={role} value={role}>{role.toUpperCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button onClick={handleEditRole} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
