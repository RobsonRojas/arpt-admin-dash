import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardActions, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  MenuItem, Paper, Radio, RadioGroup, Select, Typography,
} from '@mui/material';
import { api } from '../../../services/api';
import { useLang } from '../LangContext';
import { BASE, usePanel } from '../PanelContext';
import { applyBody, combination, filterTemplates, inLang, paletteReadable, SAMPLE_PRODUCTS, storeLanguages } from '../templates';

const TEMPLATES_URL = '/api/v1/dropshipping/storefront/templates';
const SCOPES = ['tudo', 'tema', 'blocos'];

/** Faixa de cores de uma paleta (só para ver; o contraste é garantido pelo servidor). */
const Swatches = ({ cores }) => (
  <Box sx={{ display: 'flex', gap: 0.5 }} aria-hidden>
    {['primaria', 'secundaria', 'fundo', 'texto', 'destaque'].filter((k) => cores?.[k]).map((k) => (
      <Box key={k} sx={{ width: 18, height: 18, borderRadius: '4px', border: '1px solid rgba(0,0,0,.2)', bgcolor: cores[k] }} />
    ))}
  </Box>
);

/**
 * Pré-visualização de uma composição com produtos de exemplo, desenhada aqui a partir da configuração devolvida pela biblioteca:
 * não chama a API de nenhuma loja e não grava nada.
 */
export function TemplatePreview({ config, lang }) {
  const { t } = useLang();
  if (!config) return null;
  const c = config.tema?.cores ?? {};
  const radius = { arredondado: '8px', quadrado: '0', pilula: '999px' }[config.tema?.estilo_botoes] ?? '8px';
  const font = { serifada: 'Georgia, serif', monoespacada: 'ui-monospace, monospace', arredondada: '"Trebuchet MS", sans-serif' }[config.tema?.fonte] ?? 'system-ui, sans-serif';
  const btn = { display: 'inline-block', padding: '8px 14px', background: c.primaria, color: '#fff', borderRadius: radius };
  return (
    <Box data-testid="template-preview" sx={{ p: 2, bgcolor: c.fundo, color: c.texto, fontFamily: font, border: '1px solid rgba(0,0,0,.12)', borderRadius: 1 }}>
      <Typography variant="caption" display="block" sx={{ mb: 1, opacity: 0.8 }}>{t('preview_sample')}</Typography>
      {(config.blocos ?? []).map((b) => {
        const exemplo = b.exemplo ? <Chip size="small" label={t('example_mark')} sx={{ ml: 1 }} /> : null;
        if (b.tipo === 'hero') return <Box key={b.id} sx={{ p: 2, mb: 2, bgcolor: c.primaria, color: '#fff', borderRadius: 1 }}><strong>{b.titulo}</strong>{exemplo}{b.subtitulo && <p>{b.subtitulo}</p>}{b.botao_texto && <span style={{ ...btn, background: '#fff', color: c.primaria }}>{b.botao_texto}</span>}</Box>;
        if (b.tipo === 'produtos_destaque') return (
          <Box key={b.id} sx={{ mb: 2 }}>{b.titulo && <strong>{b.titulo}</strong>}{exemplo}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mt: 1 }}>
              {SAMPLE_PRODUCTS.map((p) => <Box key={p.id} sx={{ p: 1, border: '1px solid rgba(0,0,0,.15)', borderRadius: 1, fontSize: 12 }}>{inLang(p.nome, lang)}<br /><span style={{ ...btn, padding: '2px 8px', marginTop: 4 }}>+</span></Box>)}
            </Box>
          </Box>
        );
        if (b.tipo === 'texto') return <Box key={b.id} sx={{ mb: 2 }}>{exemplo}<Typography variant="body2" component="div">{String(b.html ?? '').replace(/<[^>]*>/g, ' ').trim()}</Typography></Box>;
        if (b.tipo === 'faq') return <Box key={b.id} sx={{ mb: 2 }}>{exemplo}{(b.itens ?? []).map((i, k) => <Typography key={k} variant="body2"><strong>{i.pergunta}</strong></Typography>)}</Box>;
        if (b.tipo === 'depoimentos') return <Box key={b.id} sx={{ mb: 2 }}>{exemplo}{(b.itens ?? []).map((i, k) => <Typography key={k} variant="body2">“{i.texto}” — {i.nome}</Typography>)}</Box>;
        if (b.tipo === 'newsletter') return <Box key={b.id} sx={{ mb: 2, p: 1, border: `1px solid ${c.secundaria}`, borderRadius: 1 }}><strong>{b.titulo}</strong>{exemplo}{b.texto && <p style={{ margin: 0 }}>{b.texto}</p>}</Box>;
        if (b.tipo === 'contato') return <Box key={b.id} sx={{ mb: 2 }}>{exemplo}<Typography variant="body2">{b.texto}</Typography></Box>;
        return null;
      })}
    </Box>
  );
}

/** Galeria de templates: filtro, pré-visualização, aplicar com escopo e idiomas, desfazer e trocar paleta ou estilo. */
export default function TemplateGallery() {
  const { t, err, lang } = useLang();
  const { store, config, reload, notify } = usePanel();
  const [catalogo, setCatalogo] = useState(null);
  const [categoria, setCategoria] = useState(''); const [estilo, setEstilo] = useState('');
  const [livre, setLivre] = useState(false);
  const [escolha, setEscolha] = useState({ template: '', layout: '', paleta: '', estilo: '' });
  const [escopo, setEscopo] = useState('tudo');
  const [idiomas, setIdiomas] = useState(() => storeLanguages(config?.rascunho));
  const [preview, setPreview] = useState(null);
  const [confirmar, setConfirmar] = useState(false);
  const [podeDesfazer, setPodeDesfazer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [partes, setPartes] = useState({ paleta: '', estilo: '' });

  useEffect(() => { api.get(TEMPLATES_URL).then((r) => setCatalogo(r.data)).catch(() => setCatalogo({ templates: [], categorias: [], layouts: [], paletas: [], estilos: [] })); }, []);
  useEffect(() => { setIdiomas(storeLanguages(config?.rascunho)); }, [config?.rascunho?.idiomas]);

  const lista = useMemo(() => filterTemplates(catalogo?.templates, { categoria, estilo }), [catalogo, categoria, estilo]);
  const comb = combination(livre ? { layout: escolha.layout, paleta: escolha.paleta, estilo: escolha.estilo } : { template: escolha.template });
  const body = applyBody(comb, escopo, idiomas);
  const paletas = catalogo?.paletas ?? [];

  const verPrevia = async (c) => {
    try {
      const params = { ...c, idiomas: lang === 'en' ? 'en' : 'pt' };
      const r = await api.get(`${TEMPLATES_URL}/compose`, { params });
      setPreview(r.data.config);
    } catch (e) { notify('error', err(e)); }
  };

  const aplicar = async () => {
    setConfirmar(false); setBusy(true);
    try {
      await api.post(`${BASE(store.id)}/storefront/template`, body);
      setPodeDesfazer(true); notify('success', t('template_applied')); await reload();
    } catch (e) { notify('error', err(e)); } finally { setBusy(false); }
  };
  const desfazer = async () => {
    setBusy(true);
    try { await api.post(`${BASE(store.id)}/storefront/template/undo`); setPodeDesfazer(false); notify('success', t('template_undone')); await reload(); }
    catch (e) { setPodeDesfazer(false); notify('error', err(e)); } finally { setBusy(false); }
  };
  const trocar = async (peca) => {
    setBusy(true);
    try { await api.put(`${BASE(store.id)}/storefront/theme-parts`, { [peca]: partes[peca] }); notify('success', t('parts_applied')); await reload(); }
    catch (e) { notify('error', err(e)); } finally { setBusy(false); }
  };
  const alternarIdioma = (l) => setIdiomas((v) => (v.includes(l) ? v.filter((x) => x !== l) : [...v, l]));
  const nomeDe = (lista2, id) => inLang(lista2?.find((x) => x.id === id)?.nome, lang);

  if (!catalogo) return null;
  return (
    <Paper sx={{ p: 2, display: 'grid', gap: 2 }} data-testid="template-gallery">
      <Box>
        <Typography variant="h6">{t('gallery')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('gallery_intro')}</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControlLabel control={<Checkbox checked={livre} onChange={(e) => setLivre(e.target.checked)} inputProps={{ 'data-testid': 'gallery-free' }} />} label={t('gallery_free')} />
        {!livre && (
          <>
            <Select size="small" value={categoria} displayEmpty onChange={(e) => setCategoria(e.target.value)} data-testid="gallery-category" sx={{ minWidth: 200 }}>
              <MenuItem value="">{t('gallery_category')}: {t('gallery_all')}</MenuItem>
              {catalogo.categorias.map((c) => <MenuItem key={c.id} value={c.id}>{inLang(c.nome, lang)}</MenuItem>)}
            </Select>
            <Select size="small" value={estilo} displayEmpty onChange={(e) => setEstilo(e.target.value)} data-testid="gallery-style" sx={{ minWidth: 160 }}>
              <MenuItem value="">{t('gallery_style')}: {t('gallery_all')}</MenuItem>
              {catalogo.estilos.map((s) => <MenuItem key={s.id} value={s.id}>{inLang(s.nome, lang)}</MenuItem>)}
            </Select>
          </>
        )}
      </Box>

      {livre ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          {[['layout', catalogo.layouts, 'gallery_layout'], ['paleta', paletas, 'gallery_palette'], ['estilo', catalogo.estilos, 'gallery_style']].map(([k, opcoes, rotulo]) => (
            <Box key={k}><Typography variant="caption">{t(rotulo)}</Typography>
              <Select fullWidth size="small" value={escolha[k]} displayEmpty onChange={(e) => setEscolha({ ...escolha, [k]: e.target.value })} data-testid={`free-${k}`}>
                <MenuItem value="">—</MenuItem>{opcoes.map((o) => <MenuItem key={o.id} value={o.id}>{inLang(o.nome, lang)}</MenuItem>)}
              </Select></Box>
          ))}
          <Box sx={{ alignSelf: 'end' }}><Button disabled={!comb} onClick={() => verPrevia(comb)}>{t('gallery_preview')}</Button></Box>
        </Box>
      ) : lista.length === 0 ? <Typography variant="body2" color="text.secondary">{t('gallery_empty')}</Typography> : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
          {lista.map((tpl) => {
            const cores = paletas.find((p) => p.id === tpl.paleta)?.cores;
            const sel = escolha.template === tpl.id;
            return (
              <Card key={tpl.id} variant="outlined" sx={{ borderColor: sel ? 'primary.main' : undefined, borderWidth: sel ? 2 : 1 }} data-testid={`tpl-${tpl.id}`}>
                <CardContent sx={{ pb: 1 }}>
                  <Typography variant="subtitle1">{inLang(tpl.nome, lang)}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{inLang(tpl.descricao, lang)}</Typography>
                  <Swatches cores={cores} />
                  <Typography variant="caption" color="text.secondary">{nomeDe(catalogo.layouts, tpl.layout)} · {nomeDe(catalogo.estilos, tpl.estilo)}</Typography>
                  {cores && paletteReadable(cores) && <Typography variant="caption" display="block" color="success.main">{t('gallery_contrast_ok')}</Typography>}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => verPrevia({ template: tpl.id })}>{t('gallery_preview')}</Button>
                  <Button size="small" variant={sel ? 'contained' : 'text'} onClick={() => setEscolha({ ...escolha, template: tpl.id })}>{sel ? t('gallery_selected') : t('gallery_choose')}</Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 1 }}>
        <Typography variant="subtitle2">{t('apply_scope')}</Typography>
        <RadioGroup row value={escopo} onChange={(e) => setEscopo(e.target.value)}>
          {SCOPES.map((s) => <FormControlLabel key={s} value={s} control={<Radio size="small" inputProps={{ 'data-testid': `scope-${s}` }} />} label={t(`scope_${s}`)} />)}
        </RadioGroup>
        {escopo !== 'tema' && (
          <Box>
            <Typography variant="subtitle2">{t('apply_langs')}</Typography>
            {['pt', 'en'].map((l) => <FormControlLabel key={l} control={<Checkbox size="small" checked={idiomas.includes(l)} onChange={() => alternarIdioma(l)} inputProps={{ 'data-testid': `lang-${l}` }} />} label={t(`lang_${l}`)} />)}
            {!idiomas.length && <Typography variant="caption" color="error">{t('apply_langs_hint')}</Typography>}
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" disabled={!body || busy} onClick={() => setConfirmar(true)} data-testid="apply-template">{t('apply_template')}</Button>
          {podeDesfazer && <Button onClick={desfazer} disabled={busy} data-testid="undo-template">{t('undo_template')}</Button>}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gap: 1 }}>
        <Typography variant="subtitle2">{t('change_parts')}</Typography>
        <Typography variant="caption" color="text.secondary">{t('change_parts_hint')}</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select size="small" value={partes.paleta} displayEmpty onChange={(e) => setPartes({ ...partes, paleta: e.target.value })} data-testid="parts-palette" sx={{ minWidth: 180 }}>
            <MenuItem value="">{t('gallery_palette')}</MenuItem>{paletas.map((p) => <MenuItem key={p.id} value={p.id}>{inLang(p.nome, lang)}</MenuItem>)}
          </Select>
          <Button size="small" disabled={!partes.paleta || busy} onClick={() => trocar('paleta')} data-testid="apply-palette">{t('apply_palette')}</Button>
          <Select size="small" value={partes.estilo} displayEmpty onChange={(e) => setPartes({ ...partes, estilo: e.target.value })} data-testid="parts-style" sx={{ minWidth: 160 }}>
            <MenuItem value="">{t('gallery_style')}</MenuItem>{catalogo.estilos.map((s) => <MenuItem key={s.id} value={s.id}>{inLang(s.nome, lang)}</MenuItem>)}
          </Select>
          <Button size="small" disabled={!partes.estilo || busy} onClick={() => trocar('estilo')} data-testid="apply-style">{t('apply_style')}</Button>
        </Box>
      </Box>

      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="md" fullWidth>
        <DialogTitle>{t('gallery_preview')}</DialogTitle>
        <DialogContent><TemplatePreview config={preview} lang={lang} /></DialogContent>
        <DialogActions><Button onClick={() => setPreview(null)}>{t('close')}</Button></DialogActions>
      </Dialog>
      <Dialog open={confirmar} onClose={() => setConfirmar(false)}>
        <DialogContent><Alert severity="warning">{t('confirm_apply', { scope: t(`scope_${escopo}`).toLowerCase() })}</Alert></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmar(false)} data-testid="cancel-apply">{t('cancel')}</Button>
          <Button variant="contained" onClick={aplicar} data-testid="confirm-apply">{t('apply_template')}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
