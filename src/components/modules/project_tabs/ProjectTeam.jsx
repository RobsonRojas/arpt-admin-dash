import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, 
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Divider, Alert, Tooltip
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

      <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, mt: 2 }}>Membros Ativos</Typography>
      <List>
        {members.length === 0 ? (
          <Typography variant="body2" color="textSecondary" align="center" py={2}>
            Nenhum membro ativo.
          </Typography>
        ) : (
          members.map((member) => (
            <React.Fragment key={member.id}>
              <ListItem>
                <ListItemText
                  primary={`${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email}
                  secondary={
                    <Box component="span" display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'primary.main' }}>
                        {member.role}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        • {member.email}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Alterar Cargo">
                    <IconButton edge="end" size="small" onClick={() => {
                      setSelectedMember(member);
                      setEditRole(member.role);
                      setEditOpen(true);
                    }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remover">
                    <IconButton edge="end" size="small" color="error" onClick={() => handleRemove(member.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))
        )}
      </List>

      {invitations.length > 0 && (
        <>
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, mt: 3 }}>Convites Pendentes</Typography>
          <List>
            {invitations.map((invitation) => (
              <React.Fragment key={invitation.id}>
                <ListItem>
                  <ListItemText
                    primary={invitation.email}
                    secondary={
                      <Box component="span" display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'warning.main' }}>
                          Pendente ({invitation.role})
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          • Expira em: {new Date(invitation.expires_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        </>
      )}

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
