import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, MenuItem, Paper, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';

/** Equipe (só o dono): membros, convites pendentes, papel e remoção. */
export default function Team() {
  const { t, err } = useLang();
  const { store, notify } = usePanel();
  const [team, setTeam] = useState({ members: [], invites: [] });
  const [email, setEmail] = useState(''); const [papel, setPapel] = useState('editor'); const [busy, setBusy] = useState(false);
  const base = BASE(store.id);
  const load = useCallback(() => api.get(`${base}/members`).then((r) => setTeam(r.data)).catch((e) => notify('error', err(e))), [base]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, okKey) => { setBusy(true); try { await fn(); if (okKey) notify('success', t(okKey)); await load(); } catch (e) { notify('error', err(e)); } finally { setBusy(false); } };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" label={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} sx={{ minWidth: 260 }} inputProps={{ 'data-testid': 'invite-email' }} />
        <Select size="small" value={papel} onChange={(e) => setPapel(e.target.value)} data-testid="invite-role"><MenuItem value="editor">{t('role_editor')}</MenuItem><MenuItem value="financeiro">{t('role_financeiro')}</MenuItem></Select>
        <Button variant="contained" disabled={busy || !email.trim()} data-testid="invite" onClick={() => run(async () => { await api.post(`${base}/members/invite`, { email: email.trim(), papel }); setEmail(''); }, 'invite_sent')}>{t('invite')}</Button>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>{t('email')}</TableCell><TableCell>{t('role')}</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {team.members.map((m) => (
              <TableRow key={`m${m.id}`} data-testid={`member-${m.email}`}>
                <TableCell>{m.email}</TableCell>
                <TableCell>{m.papel === 'dono' ? t('role_dono') : (
                  <Select size="small" value={m.papel} onChange={(e) => run(() => api.put(`${base}/members/${m.id}`, { papel: e.target.value }), 'saved')}>
                    <MenuItem value="editor">{t('role_editor')}</MenuItem><MenuItem value="financeiro">{t('role_financeiro')}</MenuItem>
                  </Select>)}</TableCell>
                <TableCell>{m.papel !== 'dono' && <Button size="small" color="error" disabled={busy} onClick={() => window.confirm(t('confirm_remove_member')) && run(() => api.delete(`${base}/members/${m.id}`), 'member_removed')}>{t('remove')}</Button>}</TableCell>
              </TableRow>
            ))}
            {team.invites.map((i) => (
              <TableRow key={`i${i.id}`} data-testid={`invite-${i.email}`}>
                <TableCell>{i.email}</TableCell><TableCell>{t(`role_${i.papel}`)} · {t('pending_invite')}</TableCell>
                <TableCell><Button size="small" disabled={busy} onClick={() => run(() => api.post(`${base}/invites/${i.id}/resend`), 'invite_sent')}>{t('resend')}</Button>
                  <Button size="small" color="error" disabled={busy} onClick={() => run(() => api.delete(`${base}/invites/${i.id}`), 'saved')}>{t('remove')}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
