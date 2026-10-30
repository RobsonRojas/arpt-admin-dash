import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Pagination, Paper,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';

const PAGINAS = ['INICIO', 'CATALOGO', 'PRODUTO', 'CONTEUDO', 'CARRINHO', 'CHECKOUT'];
const POR_PAGINA = 20;
/** Abaixo disto, a porcentagem engana: mostra só a contagem. */
const AMOSTRA_MINIMA_PERCENTUAL = 10;

/**
 * Pesquisa de visitantes da loja (expand-exit-survey-to-dropshipping, decisão 7). Só o dono vê (a API recusa os demais papéis), só
 * leitura, sem e-mail e sem exportação. Resumo e lista usam o MESMO filtro.
 */
export default function Survey() {
  const { t, lang, err } = useLang();
  const { store, products } = usePanel();
  const [filtro, setFiltro] = useState({ de: '', ate: '', origem: '', idProduto: '' });
  const [pagina, setPagina] = useState(1);
  const [resumo, setResumo] = useState(null);
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  // O filtro vai como texto às dependências: o mesmo recorte não refaz a busca.
  const chave = JSON.stringify(Object.fromEntries(Object.entries(filtro).filter(([, v]) => v !== '')));
  useEffect(() => {
    let vivo = true; setErro(null);
    api.get(`${BASE(store.id)}/pesquisa-saida/resumo`, { params: JSON.parse(chave) })
      .then((r) => { if (vivo) setResumo(r.data); }).catch((e) => { if (vivo) setErro(e); });
    return () => { vivo = false; };
  }, [store.id, chave]);
  useEffect(() => {
    let vivo = true;
    api.get(`${BASE(store.id)}/pesquisa-saida/respostas`, { params: { ...JSON.parse(chave), pagina, porPagina: POR_PAGINA } })
      .then((r) => { if (vivo) setLista(r.data); }).catch((e) => { if (vivo) setErro(e); });
    return () => { vivo = false; };
  }, [store.id, chave, pagina]);

  // Mudar o filtro volta para a página 1: a lista e o resumo falam do mesmo recorte.
  const mudar = (k, v) => { setFiltro((f) => ({ ...f, [k]: v })); setPagina(1); };
  const abrir = (id) => api.get(`${BASE(store.id)}/pesquisa-saida/respostas/${id}`).then((r) => setDetalhe(r.data)).catch((e) => setErro(e));

  const nomes = Object.fromEntries((resumo?.produtos ?? products ?? []).map((p) => [String(p.id ?? p.produto_id), p.nome]));
  const data = (v) => new Date(v).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR');
  const quanto = (n) => (resumo && resumo.total >= AMOSTRA_MINIMA_PERCENTUAL ? `${n} (${Math.round((n / resumo.total) * 100)}%)` : String(n));
  const motivos = (lista_) => lista_.map((m) => t(`reason_${m}`)).join(', ');
  const ordenado = (o) => Object.entries(o ?? {}).sort((a, b) => b[1] - a[1]);

  if (erro && !resumo) return <Alert severity="error">{err(erro)}</Alert>;
  if (!resumo) return <CircularProgress />;
  return (
    <Paper sx={{ p: 2, display: 'grid', gap: 2 }} data-testid="survey-section">
      <Typography variant="h6">{t('menu_survey')}</Typography>
      <Typography color="text.secondary">{t('survey_intro')}</Typography>
      {resumo.ativa === false && <Alert severity="info" data-testid="survey-off">{t('survey_off')}</Alert>}
      {erro && <Alert severity="error">{err(erro)}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField size="small" type="date" label={t('survey_from')} InputLabelProps={{ shrink: true }} value={filtro.de} onChange={(e) => mudar('de', e.target.value)} />
        <TextField size="small" type="date" label={t('survey_to')} InputLabelProps={{ shrink: true }} value={filtro.ate} onChange={(e) => mudar('ate', e.target.value)} />
        <TextField select size="small" sx={{ minWidth: 180 }} label={t('survey_page')} value={filtro.origem} onChange={(e) => mudar('origem', e.target.value)}>
          <MenuItem value="">{t('survey_all')}</MenuItem>
          {PAGINAS.map((p) => <MenuItem key={p} value={p}>{t(`origin_${p}`)}</MenuItem>)}
        </TextField>
        <TextField select size="small" sx={{ minWidth: 200 }} label={t('survey_product')} value={filtro.idProduto} onChange={(e) => mudar('idProduto', e.target.value)}>
          <MenuItem value="">{t('survey_all_products')}</MenuItem>
          {(resumo.produtos ?? []).map((p) => <MenuItem key={p.id} value={String(p.id)}>{p.nome}</MenuItem>)}
        </TextField>
      </Box>

      {resumo.total === 0 ? (
        <Alert severity="info" data-testid="survey-empty">{t('survey_empty', { de: resumo.periodo?.de ?? '—' })}</Alert>
      ) : (
        <>
          <Typography variant="subtitle1" data-testid="survey-total">{t('survey_total', { n: resumo.total })}</Typography>
          {resumo.total < AMOSTRA_MINIMA_PERCENTUAL && <Typography variant="caption" color="text.secondary">{t('survey_small_sample')}</Typography>}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            {[
              ['survey_reasons', ordenado(resumo.motivos).map(([m, n]) => [t(`reason_${m}`), n, `reason-${m}`])],
              ['survey_by_page', ordenado(resumo.porOrigem).map(([p, n]) => [t(`origin_${p}`), n, `origin-${p}`])],
              ['survey_by_product', ordenado(resumo.porProduto).map(([id, n]) => [nomes[id] ?? `#${id}`, n, `product-${id}`])],
            ].map(([titulo, linhas]) => (
              <Box key={titulo}>
                <Typography variant="subtitle2">{t(titulo)}</Typography>
                {linhas.length === 0 ? <Typography variant="body2" color="text.secondary">{t('survey_no_reasons')}</Typography>
                  : linhas.map(([rotulo, n, id]) => <Typography key={id} variant="body2" data-testid={`survey-${id}`}>{rotulo}: {quanto(n)}</Typography>)}
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">{t('survey_bias')}</Typography>
          <Alert severity="warning">{t('survey_free_text')}</Alert>
          {lista && (
            <>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>{t('survey_date')}</TableCell><TableCell>{t('survey_page')}</TableCell><TableCell>{t('survey_product')}</TableCell>
                  <TableCell>{t('survey_reasons')}</TableCell><TableCell>{t('survey_comment')}</TableCell><TableCell />
                </TableRow></TableHead>
                <TableBody>
                  {lista.respostas.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{data(r.created_at)}</TableCell>
                      <TableCell>{t(`origin_${r.pagina}`)}</TableCell>
                      <TableCell>{r.id_produto ? (nomes[String(r.id_produto)] ?? `#${r.id_produto}`) : '—'}</TableCell>
                      <TableCell>{motivos(r.motivos)}</TableCell>
                      <TableCell sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.texto_livre ?? '—'}</TableCell>
                      <TableCell><Button size="small" onClick={() => abrir(r.id)}>{t('survey_view')}</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {lista.total > POR_PAGINA && <Pagination count={Math.ceil(lista.total / POR_PAGINA)} page={pagina} onChange={(_, p) => setPagina(p)} />}
            </>
          )}
        </>
      )}

      <Dialog open={!!detalhe} onClose={() => setDetalhe(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('survey_detail')}</DialogTitle>
        {detalhe && (
          <DialogContent sx={{ display: 'grid', gap: 1 }}>
            <Typography variant="body2">{t('survey_date')}: {data(detalhe.created_at)}</Typography>
            <Typography variant="body2">{t('survey_page')}: {t(`origin_${detalhe.pagina}`)}</Typography>
            {detalhe.id_produto && <Typography variant="body2">{t('survey_product')}: {nomes[String(detalhe.id_produto)] ?? `#${detalhe.id_produto}`}</Typography>}
            <Typography variant="body2">{t('survey_reasons')}: {motivos(detalhe.motivos) || '—'}</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{t('survey_comment')}: {detalhe.texto_livre ?? '—'}</Typography>
            <Alert severity="warning">{t('survey_free_text')}</Alert>
          </DialogContent>
        )}
        <DialogActions><Button onClick={() => setDetalhe(null)}>{t('survey_close')}</Button></DialogActions>
      </Dialog>
    </Paper>
  );
}
