import React, { useState } from 'react';
import { Box, Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';

const money = (n, lang) => Number(n ?? 0).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { style: 'currency', currency: 'BRL' });

export default function Products() {
  const { t, lang, err } = useLang();
  const { store, products, access, reload, notify } = usePanel();
  const [prices, setPrices] = useState({});
  const [busy, setBusy] = useState(null);
  const editable = access === 'edit';

  const save = async (p) => {
    const v = Number(String(prices[p.produto_id]).replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) return notify('error', t('err_price'));
    setBusy(p.produto_id);
    try { await api.put(`${BASE(store.id)}/products/${p.produto_id}`, { preco_venda: v }); notify('success', t('saved')); setPrices((s) => { const { [p.produto_id]: _, ...rest } = s; return rest; }); await reload(); }
    catch (e) { notify('error', err(e)); } finally { setBusy(null); }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>{t('menu_products')}</Typography>
      {!editable && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t('read_only')}</Typography>}
      {!products.length ? <Typography data-testid="no-products">{t('no_products')}</Typography> : (
        <Table size="small">
          <TableHead><TableRow><TableCell>{t('product')}</TableCell><TableCell>{t('sale_price')}</TableCell><TableCell>{t('min_price')}</TableCell><TableCell>{t('status')}</TableCell>{editable && <TableCell />}</TableRow></TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.produto_id} data-testid={`product-${p.produto_id}`}>
                <TableCell>{p.nome}</TableCell>
                <TableCell>{editable
                  ? <TextField size="small" value={prices[p.produto_id] ?? String(p.preco_venda)} onChange={(e) => setPrices({ ...prices, [p.produto_id]: e.target.value })} inputProps={{ 'aria-label': t('sale_price'), 'data-testid': `price-${p.produto_id}` }} sx={{ width: 120 }} />
                  : money(p.preco_venda, lang)}</TableCell>
                <TableCell>{money(p.preco_minimo, lang)}</TableCell>
                <TableCell><Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip size="small" label={p.ativo ? t('active') : t('paused')} color={p.ativo ? 'success' : 'default'} />
                  {p.frete_calculavel === false && <Chip size="small" color="warning" label={t('no_shipping_data')} />}
                </Box></TableCell>
                {editable && <TableCell><Button size="small" disabled={busy === p.produto_id || prices[p.produto_id] === undefined} onClick={() => save(p)} data-testid={`save-price-${p.produto_id}`}>{t('save')}</Button></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {editable && <Button href="/dropshipping" sx={{ mt: 2 }}>{t('add_products')}</Button>}
    </Paper>
  );
}
