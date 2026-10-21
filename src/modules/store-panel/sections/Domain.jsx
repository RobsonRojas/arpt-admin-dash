import React, { useState } from 'react';
import { Alert, Box, Button, Chip, Paper, TextField, Typography } from '@mui/material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';

const TLS_COLOR = { ATIVO: 'success', EMITINDO: 'info', FALHA: 'error' };

/** Domínio próprio: cadastrar, mostrar o que configurar no DNS, verificar e remover. A verificação e o TLS são do servidor. */
export default function Domain() {
  const { t, err } = useLang();
  const { store, domains, reload, notify, access } = usePanel();
  const [host, setHost] = useState(''); const [busy, setBusy] = useState(false); const [lastCheck, setLastCheck] = useState({});
  const d = (rota = '') => `${BASE(store.id)}/storefront/domains${rota}`;
  const editable = access === 'edit';

  const run = async (fn) => { setBusy(true); try { await fn(); await reload(); } catch (e) { notify('error', err(e)); } finally { setBusy(false); } };
  const add = () => run(async () => { await api.post(d(), { dominio: host.trim().toLowerCase() }); setHost(''); notify('success', t('domain_added')); });
  const verify = (x) => run(async () => { const r = await api.post(d(`/${x.id}/verify`)); setLastCheck({ ...lastCheck, [x.id]: r.data }); });
  const remove = (x) => { if (window.confirm(t('confirm_remove_domain'))) run(async () => { await api.delete(d(`/${x.id}`)); notify('success', t('domain_removed')); }); };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <TextField size="small" label={t('domain_name')} value={host} onChange={(e) => setHost(e.target.value)} placeholder="loja.exemplo.com.br" sx={{ minWidth: 280 }} inputProps={{ 'data-testid': 'field-dominio' }} disabled={!editable} />
        <Button variant="contained" onClick={add} disabled={busy || !host.trim() || !editable} data-testid="add-domain">{t('add_domain')}</Button>
      </Paper>
      {!domains.length && <Typography color="text.secondary" data-testid="no-domains">{t('no_domains')}</Typography>}
      {domains.map((x) => (
        <Paper key={x.id} sx={{ p: 2, display: 'grid', gap: 1 }} data-testid={`domain-${x.dominio}`}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="subtitle1">{x.dominio}</Typography>
            <Chip size="small" label={t(`domain_${x.status}`)} data-testid="domain-status" />
            {x.tls_status && <Chip size="small" color={TLS_COLOR[x.tls_status] ?? 'default'} label={`TLS: ${t(`tls_${x.tls_status}`)}`} data-testid="domain-tls" />}
            <Box sx={{ flex: 1 }} />
            {x.status !== 'VERIFICADO' && <Button size="small" onClick={() => verify(x)} disabled={busy} data-testid="verify-domain">{t('verify')}</Button>}
            <Button size="small" color="error" onClick={() => remove(x)} disabled={busy}>{t('remove')}</Button>
          </Box>
          {x.tls_status === 'FALHA' && x.tls_motivo && <Alert severity="error">{t('tls_failed')}</Alert>}
          {x.status !== 'VERIFICADO' && x.instrucoes && (
            <Box data-testid="dns-instructions">
              <Typography variant="body2">{t('dns_txt', { name: x.instrucoes.txt?.nome ?? '', value: x.instrucoes.txt?.valor ?? '' })}</Typography>
              <Typography variant="body2">{t('dns_cname', { value: x.instrucoes.cname?.valor ?? x.instrucoes.apontamento?.valor ?? '' })}</Typography>
            </Box>
          )}
          {lastCheck[x.id] && lastCheck[x.id].verificado === false && <Alert severity="warning" data-testid="verify-pending">{t('verify_pending', { items: (lastCheck[x.id].faltando ?? []).join(', ') })}</Alert>}
        </Paper>
      ))}
    </Box>
  );
}
