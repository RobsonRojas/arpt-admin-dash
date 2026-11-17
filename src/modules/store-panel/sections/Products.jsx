import React from 'react';
import { Box, Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useLang } from '../LangContext';
import { usePanel } from '../PanelContext';

const money = (n, lang) => Number(n ?? 0).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { style: 'currency', currency: 'BRL' });

export default function Products() {
  const { t, lang } = useLang();
  const { products } = usePanel();

  // O preço é o do produtor e o dropshipper recebe a comissão percentual (base + bônus): não há campo de preço aqui.
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>{t('menu_products')}</Typography>
      {!products.length ? <Typography data-testid="no-products">{t('no_products')}</Typography> : (
        <Table size="small">
          <TableHead><TableRow><TableCell>{t('product')}</TableCell><TableCell>{t('producer_price')}</TableCell><TableCell>{t('your_commission')}</TableCell><TableCell>{t('status')}</TableCell></TableRow></TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.produto_id} data-testid={`product-${p.produto_id}`}>
                <TableCell>{p.nome}</TableCell>
                <TableCell>{money(p.preco_final ?? p.preco_produtor, lang)}</TableCell>
                <TableCell>{p.comissao_dropshipper_percent != null ? `${p.comissao_dropshipper_percent}% (${money(p.comissao_dropshipper_valor, lang)})` : '—'}</TableCell>
                <TableCell><Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {p.em_revisao
                    ? <Chip size="small" color="warning" label={t('under_review')} />
                    : <Chip size="small" label={p.ativo ? t('active') : t('paused')} color={p.ativo ? 'success' : 'default'} />}
                  {p.frete_calculavel === false && <Chip size="small" color="warning" label={t('no_shipping_data')} />}
                </Box></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Button href="/dropshipping" sx={{ mt: 2 }}>{t('add_products')}</Button>
    </Paper>
  );
}
