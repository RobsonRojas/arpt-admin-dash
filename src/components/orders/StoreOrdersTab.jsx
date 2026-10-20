import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tooltip, Typography,
} from '@mui/material';
import { api } from '../../services/api';
import {
  apiError, cancelHint, cancelResultMessage, countByStatus, dateTime, deadlineText, holdReasonLabel, money, payoutStatusLabel,
  slaDelay, slaRate, statusColor, statusLabel, totalMargin,
} from '../../utils/orders';

/**
 * Pedidos e repasses da loja do dropshipper. Mostra só o que é dele: status, prazo, rastreio e a MARGEM da loja
 * (nunca o valor do produtor nem a comissão, que a API não envia). Pedido e repasse de outra loja não aparecem:
 * a API responde 404 para loja alheia.
 */
export default function StoreOrdersTab({ storeId }) {
  const [orders, setOrders] = useState(null);
  const [payouts, setPayouts] = useState(null);
  const [sla, setSla] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);

  const base = `/api/v1/dropshipping/stores/${storeId}`;

  const load = useCallback(async () => {
    setError('');
    try {
      const [o, p, s] = await Promise.all([api.get(`${base}/orders`), api.get(`${base}/payouts`), api.get(`${base}/sla`)]);
      setOrders(o.data);
      setPayouts(p.data);
      setSla(s.data);
    } catch (err) {
      // 404 quando os pedidos ainda não estão ligados para esta loja (loja piloto): não é erro do usuário.
      setError(err?.response?.status === 404
        ? 'Pedidos ainda não estão disponíveis para esta loja.'
        : apiError(err, 'Não foi possível carregar os pedidos.'));
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  const cancel = async (order) => {
    const hint = cancelHint(order.status);
    if (!hint.allowed) return;
    if (!window.confirm(`Cancelar o pedido #${order.id}? ${hint.text}`)) return;
    setBusyId(order.id);
    setNotice('');
    try {
      const res = await api.post(`${base}/orders/${order.id}/cancel`, {});
      setNotice(cancelResultMessage(res.data));
      await load();
    } catch (err) {
      setError(apiError(err, 'Não foi possível cancelar.'));
    } finally {
      setBusyId(null);
    }
  };

  if (error && !orders) return <Alert severity="info" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!orders) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  const counts = countByStatus(orders);
  const releasable = (payouts?.repasses ?? []).filter((r) => r.status === 'LIBERADO').reduce((s, r) => s + Number(r.valor) - Number(r.valor_compensado || 0), 0);
  const held = (payouts?.repasses ?? []).filter((r) => r.status === 'RETIDO');

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="textSecondary">Margem esperada (pedidos ativos)</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{money(totalMargin(orders))}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="textSecondary">Repasses liberados</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{money(releasable)}</Typography>
            {payouts?.total_debitos > 0 && (
              <Typography variant="caption" color="error">Débito a compensar: {money(payouts.total_debitos)}</Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="caption" color="textSecondary">Entrega no prazo dos produtores (30 dias)</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{slaRate(sla?.janela_30d)}</Typography>
            <Typography variant="caption" color="textSecondary">Atraso médio: {slaDelay(sla?.janela_30d)} · indicador agregado</Typography>
          </Paper>
        </Grid>
      </Grid>

      {held.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {held.length} repasse(s) retido(s): {holdReasonLabel(held[0].motivo_retencao) || 'verifique sua conta de recebimento'}.
          Conclua a configuração de pagamentos e a liberação é automática.
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {counts.length === 0 && <Typography color="textSecondary">Nenhum pedido ainda.</Typography>}
        {counts.map((c) => <Chip key={c.status} label={`${c.label}: ${c.count}`} color={statusColor(c.status)} size="small" />)}
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Pedidos da loja</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Pedido</TableCell><TableCell>Status</TableCell><TableCell>Prazo</TableCell><TableCell>Rastreio</TableCell>
              <TableCell align="right">Total</TableCell><TableCell align="right">Sua margem</TableCell><TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 && <TableRow><TableCell colSpan={7} align="center">Nenhum pedido</TableCell></TableRow>}
            {orders.map((o) => {
              const hint = cancelHint(o.status);
              return (
                <TableRow key={o.id} hover>
                  <TableCell>#{o.id}<Typography variant="caption" display="block" color="textSecondary">{dateTime(o.created_at)}</Typography></TableCell>
                  <TableCell>
                    <Chip size="small" label={statusLabel(o.status)} color={statusColor(o.status)} />
                    {o.atrasado && <Chip size="small" label="Atrasado" color="error" sx={{ ml: 0.5 }} />}
                  </TableCell>
                  <TableCell>{o.prazo_prometido_em ? deadlineText(o.prazo_prometido_em) : '—'}</TableCell>
                  <TableCell>{o.rastreio_codigo ? `${o.transportadora ?? ''} ${o.rastreio_codigo}`.trim() : '—'}</TableCell>
                  <TableCell align="right">{money(o.valor_total)}</TableCell>
                  <TableCell align="right">{money(o.margem)}</TableCell>
                  <TableCell align="right">
                    {hint.allowed && (
                      <Tooltip title={hint.text}>
                        <span><Button size="small" color="error" disabled={busyId === o.id} onClick={() => cancel(o)}>Cancelar</Button></span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Extrato de repasses</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>Pedido</TableCell><TableCell>Status</TableCell><TableCell align="right">Valor</TableCell><TableCell>Liberação</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {(payouts?.repasses ?? []).length === 0 && <TableRow><TableCell colSpan={4} align="center">Nenhum repasse ainda. Eles surgem depois da entrega e do prazo de arrependimento.</TableCell></TableRow>}
            {(payouts?.repasses ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell>#{r.subpedido_id}</TableCell>
                <TableCell>
                  {payoutStatusLabel(r.status)}
                  {r.motivo_retencao && <Typography variant="caption" display="block" color="warning.main">{holdReasonLabel(r.motivo_retencao)}</Typography>}
                </TableCell>
                <TableCell align="right">
                  {money(r.valor)}
                  {Number(r.valor_compensado) > 0 && <Typography variant="caption" display="block" color="textSecondary">compensado: {money(r.valor_compensado)}</Typography>}
                </TableCell>
                <TableCell>{r.liberado_em ? dateTime(r.liberado_em) : r.liberar_apos ? `a partir de ${dateTime(r.liberar_apos)}` : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
