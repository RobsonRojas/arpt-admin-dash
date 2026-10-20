import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, MenuItem, Paper,
  Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import { api } from '../services/api';
import {
  apiError, beneficiaryLabel, dateTime, deadlineText, debitTypeLabel, freightBreakdown, freightText, holdReasonLabel, money, needsReverseCost,
  openDebitTotal, parseReverseCost, payoutStatusLabel, reverseLogisticsSplit, slaDelay, slaRate, statusColor, statusLabel, STATUS_LABEL,
} from '../utils/orders';

const A = '/api/v1/admin';

/** Administração de pedidos: acompanhamento, cancelamentos que dependem do administrador, SLA e repasses. */
export const AdminOrders = () => {
  const [tab, setTab] = useState(0);
  const [orders, setOrders] = useState(null);
  const [cancellations, setCancellations] = useState([]);
  const [sla, setSla] = useState([]);
  const [payouts, setPayouts] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(null);
  // Devolução / logística reversa: o custo do envio de volta é dividido 50% produtor, 50% dropshipper.
  const [reverse, setReverse] = useState(null); // { order, registerReturn: boolean }
  const [reverseCost, setReverseCost] = useState('');
  const [reverseError, setReverseError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [o, c, s, p] = await Promise.all([
        api.get(`${A}/orders`, { params: statusFilter ? { status: statusFilter } : {} }),
        api.get(`${A}/orders/cancellations`),
        api.get(`${A}/orders/sla`),
        api.get(`${A}/payouts`),
      ]);
      setOrders(o.data); setCancellations(c.data); setSla(s.data); setPayouts(p.data);
    } catch (err) {
      setError(err?.response?.status === 404 ? 'O módulo de pedidos está desligado neste ambiente (ORDERS_ENABLED).' : apiError(err, 'Não foi possível carregar os pedidos.'));
      setOrders([]);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const act = async (key, fn, okMessage) => {
    setBusy(key); setNotice(''); setError('');
    try { await fn(); setNotice(okMessage); await load(); }
    catch (err) { setError(apiError(err)); }
    finally { setBusy(null); }
  };

  const decide = (c, aprovar) => {
    const verbo = aprovar ? 'APROVAR o cancelamento (o cliente será reembolsado)' : 'REJEITAR o cancelamento';
    if (!window.confirm(`${verbo} do pedido #${c.subpedido_id}?`)) return;
    act(`dec-${c.id}`, () => api.post(`${A}/orders/cancellations/${c.id}/decision`, { aprovar }), aprovar ? 'Cancelamento aprovado.' : 'Cancelamento rejeitado.');
  };
  const deliver = (o) => window.confirm(`Confirmar a entrega do pedido #${o.id}? O prazo de arrependimento começa agora.`)
    && act(`del-${o.id}`, () => api.post(`${A}/orders/${o.id}/deliver`), 'Entrega confirmada.');
  const registerReturn = (o) => { setReverse({ order: o, registerReturn: true }); setReverseCost(''); setReverseError(''); };
  const registerReverseCost = (o) => { setReverse({ order: o, registerReturn: false }); setReverseCost(''); setReverseError(''); };
  const confirmReverse = () => {
    const { order, registerReturn: isReturn } = reverse;
    const typed = String(reverseCost).trim();
    // Na devolução o custo é opcional (pode ser registrado depois); na logística reversa avulsa é obrigatório.
    if (isReturn && typed === '') {
      setReverse(null);
      return act(`ret-${order.id}`, () => api.post(`${A}/orders/${order.id}/return`), 'Devolução registrada. Falta registrar o custo da logística reversa.');
    }
    const parsed = parseReverseCost(reverseCost, order);
    if (!parsed.ok) { setReverseError(parsed.error); return; }
    setReverse(null);
    return isReturn
      ? act(`ret-${order.id}`, () => api.post(`${A}/orders/${order.id}/return`, { custo_logistica_reversa: parsed.value }), 'Devolução e logística reversa registradas.')
      : act(`rev-${order.id}`, () => api.post(`${A}/orders/${order.id}/reverse-logistics`, { custo: parsed.value }), 'Custo da logística reversa registrado.');
  };
  const split = reverseLogisticsSplit(parseReverseCost(reverseCost, reverse?.order ?? {}).value);

  if (orders === null) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Pedidos de Dropshipping</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}

      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        <Tab label="Pedidos" />
        <Tab label={`Cancelamentos pendentes${cancellations.length ? ` (${cancellations.length})` : ''}`} />
        <Tab label="SLA dos produtores" />
        <Tab label="Comissões e repasses" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <TextField select size="small" label="Estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 220, mb: 2 }}>
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
          </TextField>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Pedido</TableCell><TableCell>Loja</TableCell><TableCell>Status</TableCell><TableCell>Prazo</TableCell>
                <TableCell align="right">Total</TableCell><TableCell align="right">Frete (do produtor)</TableCell><TableCell align="right">Produtor</TableCell><TableCell align="right">Comissão</TableCell><TableCell align="right">Margem loja</TableCell><TableCell align="right">Ações</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {orders.length === 0 && <TableRow><TableCell colSpan={10} align="center">Nenhum pedido</TableCell></TableRow>}
                {orders.map((o) => (
                  <TableRow key={o.id} hover>
                    <TableCell>#{o.id}<Typography variant="caption" display="block" color="textSecondary">{dateTime(o.created_at)}</Typography></TableCell>
                    <TableCell>{o.loja_nome}</TableCell>
                    <TableCell>
                      <Chip size="small" label={statusLabel(o.status)} color={statusColor(o.status)} />
                      {o.atrasado && <Chip size="small" label="Atrasado" color="error" sx={{ ml: 0.5 }} />}
                      {o.reembolso_em && <Chip size="small" label="Reembolsado" sx={{ ml: 0.5 }} />}
                    </TableCell>
                    <TableCell>{o.prazo_prometido_em ? deadlineText(o.prazo_prometido_em) : '—'}</TableCell>
                    <TableCell align="right">{money(o.valor_total)}</TableCell>
                    <TableCell align="right">{freightText(o)}{freightBreakdown(o) && freightBreakdown(o).taxa > 0 && <Typography variant="caption" display="block" color="textSecondary">taxa do gateway: {money(freightBreakdown(o).taxa)}</Typography>}{Number(o.custo_logistica_reversa) > 0 && <Typography variant="caption" display="block" color="error">logística reversa: {money(o.custo_logistica_reversa)}</Typography>}</TableCell>
                    <TableCell align="right">{money(o.valor_produtor)}</TableCell>
                    <TableCell align="right">{money(o.valor_comissao)}</TableCell>
                    <TableCell align="right">{money(o.valor_margem)}</TableCell>
                    <TableCell align="right">
                      {o.status === 'ENVIADO' && <Button size="small" disabled={busy === `del-${o.id}`} onClick={() => deliver(o)}>Confirmar entrega</Button>}
                      {o.status === 'ENTREGUE' && <Button size="small" color="error" disabled={busy === `ret-${o.id}`} onClick={() => registerReturn(o)}>Devolução</Button>}
                      {needsReverseCost(o) && <Button size="small" disabled={busy === `rev-${o.id}`} onClick={() => registerReverseCost(o)}>Registrar logística reversa</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 1 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Pedido</TableCell><TableCell>Estado atual</TableCell><TableCell>Quem pediu</TableCell><TableCell>Motivo</TableCell><TableCell>Quando</TableCell><TableCell align="right">Valor</TableCell><TableCell align="right">Decisão</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {cancellations.length === 0 && <TableRow><TableCell colSpan={7} align="center">Nenhuma solicitação pendente</TableCell></TableRow>}
              {cancellations.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>#{c.subpedido_id}</TableCell>
                  <TableCell><Chip size="small" label={statusLabel(c.subpedido_status)} color={statusColor(c.subpedido_status)} /></TableCell>
                  <TableCell>{c.solicitante_tipo}</TableCell>
                  <TableCell>{c.motivo || '—'}</TableCell>
                  <TableCell>{dateTime(c.created_at)}</TableCell>
                  <TableCell align="right">{money(c.valor_total)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" color="error" disabled={busy === `dec-${c.id}`} onClick={() => decide(c, true)}>Aprovar</Button>
                    <Button size="small" disabled={busy === `dec-${c.id}`} onClick={() => decide(c, false)}>Rejeitar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 2 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Produtor</TableCell><TableCell align="right">Entregas (30 d)</TableCell><TableCell align="right">No prazo (30 d)</TableCell><TableCell align="right">Atraso médio</TableCell>
              <TableCell align="right">Entregas (90 d)</TableCell><TableCell align="right">No prazo (90 d)</TableCell><TableCell align="right">Aceite médio (h)</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {sla.length === 0 && <TableRow><TableCell colSpan={7} align="center">Sem pedidos nos últimos 90 dias</TableCell></TableRow>}
              {sla.map((p) => (
                <TableRow key={p.produtor_user_id}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{p.produtor_user_id}</TableCell>
                  <TableCell align="right">{p.janela_30d.total}</TableCell>
                  <TableCell align="right">{slaRate(p.janela_30d)}</TableCell>
                  <TableCell align="right">{slaDelay(p.janela_30d)}</TableCell>
                  <TableCell align="right">{p.janela_90d.total}</TableCell>
                  <TableCell align="right">{slaRate(p.janela_90d)}</TableCell>
                  <TableCell align="right">{p.janela_90d.aceite_medio_horas ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 3 && payouts && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {['PRODUTOR', 'DROPSHIPPER', 'ARPT'].map((t) => (
              <Grid item xs={12} sm={4} key={t}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Typography variant="caption" color="textSecondary">{t === 'ARPT' ? 'Comissão ARPT' : `Total ${beneficiaryLabel(t)}`}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{money(payouts.totais?.[t] ?? 0)}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Pedido</TableCell><TableCell>Beneficiário</TableCell><TableCell>Status</TableCell><TableCell align="right">Valor</TableCell><TableCell>Liberação</TableCell><TableCell>Gateway</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {payouts.repasses.length === 0 && <TableRow><TableCell colSpan={6} align="center">Nenhum repasse ainda</TableCell></TableRow>}
                {payouts.repasses.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>#{r.subpedido_id}</TableCell>
                    <TableCell>{beneficiaryLabel(r.beneficiario_tipo)}</TableCell>
                    <TableCell>
                      {payoutStatusLabel(r.status)}
                      {r.motivo_retencao && <Typography variant="caption" display="block" color="warning.main">{holdReasonLabel(r.motivo_retencao)}</Typography>}
                    </TableCell>
                    <TableCell align="right">{money(r.valor)}{Number(r.valor_frete_incluido) > 0 && <Typography variant="caption" display="block" color="textSecondary">inclui frete líquido: {money(r.valor_frete_incluido)}</Typography>}{Number(r.valor_compensado) > 0 && <Typography variant="caption" display="block" color="textSecondary">compensado: {money(r.valor_compensado)}</Typography>}</TableCell>
                    <TableCell>{r.liberado_em ? dateTime(r.liberado_em) : r.liberar_apos ? `a partir de ${dateTime(r.liberar_apos)}` : '—'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.gateway_ref || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 4, mb: 0.5 }}>
            Débitos em aberto{payouts.total_debitos > 0 ? ` (${money(payouts.total_debitos)})` : ''}
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
            Abatidos dos próximos repasses do beneficiário. Sem repasse futuro, ficam em aberto: não há cobrança automática.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Pedido</TableCell><TableCell>Beneficiário</TableCell><TableCell>Tipo</TableCell><TableCell align="right">Valor</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {(payouts.debitos_abertos ?? []).length === 0 && <TableRow><TableCell colSpan={4} align="center">Nenhum débito em aberto</TableCell></TableRow>}
                {(payouts.debitos_abertos ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>#{d.subpedido_id}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{d.beneficiario_user_id}<Typography variant="caption" display="block" color="textSecondary">total do beneficiário: {money(openDebitTotal(payouts.debitos_abertos, d.beneficiario_user_id))}</Typography></TableCell>
                    <TableCell>{debitTypeLabel(d.tipo)}</TableCell>
                    <TableCell align="right">{money(d.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Dialog open={!!reverse} onClose={() => setReverse(null)} fullWidth maxWidth="xs">
        <DialogTitle>{reverse?.registerReturn ? `Registrar devolução do pedido #${reverse?.order?.id}` : `Logística reversa do pedido #${reverse?.order?.id}`}</DialogTitle>
        <DialogContent>
          {reverse?.registerReturn && (
            <DialogContentText sx={{ mb: 2 }}>
              O cliente será reembolsado (produtos e frete) e repasses já liberados viram débito do produtor.
            </DialogContentText>
          )}
          <DialogContentText sx={{ mb: 2 }}>
            Custo do envio de volta, dividido 50% pelo produtor e 50% pelo dropshipper (centavo ímpar fica com a ARPT). Não é cobrado do cliente.
            {reverse?.registerReturn && ' Pode ficar em branco agora e ser registrado depois.'}
          </DialogContentText>
          <TextField autoFocus fullWidth label="Custo da logística reversa (R$)" value={reverseCost} error={!!reverseError} helperText={reverseError || ' '}
            onChange={(e) => { setReverseCost(e.target.value); setReverseError(''); }} inputProps={{ inputMode: 'decimal' }} />
          {split && (
            <Typography variant="body2" color="textSecondary">
              Produtor {money(split.produtor)} · Dropshipper {money(split.dropshipper)}{split.arpt > 0 ? ` · ARPT ${money(split.arpt)}` : ''}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReverse(null)}>Cancelar</Button>
          <Button variant="contained" color={reverse?.registerReturn ? 'error' : 'primary'} onClick={confirmReverse}>
            {reverse?.registerReturn ? 'Registrar devolução' : 'Registrar custo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminOrders;
