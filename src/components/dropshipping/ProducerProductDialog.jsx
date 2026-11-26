import React, { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField } from '@mui/material';
import { api } from '../../services/api';
import { MODOS } from '../../utils/offer';
import { FORM_PRODUTO_INICIAL, mensagemDeErro, montarCorpoDoProduto } from '../../utils/adminProducers';

/** Cadastro de produto em nome do produtor (mesmas validações do cadastro feito pelo próprio produtor). */
export default function ProducerProductDialog({ open, produtorId, onClose, onCreated }) {
  const [form, setForm] = useState(FORM_PRODUTO_INICIAL);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { if (open) { setForm(FORM_PRODUTO_INICIAL); setErro(''); } }, [open]);

  const campo = (nome) => ({ value: form[nome], onChange: (e) => setForm({ ...form, [nome]: e.target.value }), fullWidth: true, size: 'small' });

  const salvar = async () => {
    const { payload, error } = montarCorpoDoProduto(form);
    if (error) { setErro(error); return; }
    setEnviando(true);
    setErro('');
    try {
      const { data } = await api.post(`/api/v1/admin/producers/${produtorId}/products`, payload);
      onCreated?.(data);
    } catch (err) {
      setErro(mensagemDeErro(err, 'Não foi possível cadastrar o produto.'));
    } finally {
      setEnviando(false);
    }
  };

  const encomenda = form.modo_oferta !== 'PRONTA_ENTREGA';

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cadastrar produto para o produtor</DialogTitle>
      <DialogContent dividers>
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField label="Nome do produto" required {...campo('nome')} /></Grid>
          <Grid item xs={12}><TextField label="Descrição" required multiline minRows={3} {...campo('info')} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Preço (R$)" type="number" required inputProps={{ min: 0, step: '0.01' }} {...campo('preco')} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Modo de oferta" select {...campo('modo_oferta')}>
            {Object.entries(MODOS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
          </TextField></Grid>
          {!encomenda && <Grid item xs={12} sm={6}><TextField label="Estoque (unidades)" type="number" {...campo('estoque')} /></Grid>}
          {encomenda && <>
            <Grid item xs={12} sm={6}><TextField label="Produção mínima (dias)" type="number" {...campo('prazo_producao_dias_min')} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Produção máxima (dias)" type="number" {...campo('prazo_producao_dias_max')} /></Grid>
          </>}
          <Grid item xs={12} sm={6}><TextField label="Prazo de despacho (dias)" type="number" {...campo('prazo_despacho_dias')} /></Grid>
          <Grid item xs={6} sm={3}><TextField label="Peso (g)" type="number" {...campo('weight_grams')} /></Grid>
          <Grid item xs={6} sm={3}><TextField label="Largura (cm)" type="number" {...campo('width_cm')} /></Grid>
          <Grid item xs={6} sm={3}><TextField label="Altura (cm)" type="number" {...campo('height_cm')} /></Grid>
          <Grid item xs={6} sm={3}><TextField label="Comprimento (cm)" type="number" {...campo('length_cm')} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="CEP de origem" {...campo('cep_origem')} /></Grid>
          <Grid item xs={12}><TextField label="URL da foto principal" {...campo('foto_url')} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={enviando}>Cancelar</Button>
        <Button variant="contained" onClick={salvar} disabled={enviando}>{enviando ? 'Salvando…' : 'Cadastrar produto'}</Button>
      </DialogActions>
    </Dialog>
  );
}
