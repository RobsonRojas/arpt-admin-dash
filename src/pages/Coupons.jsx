import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { api } from '../services/api';
import { corpoCupom, descricaoValor, errosCupom, estadoDoCupom, formDoCupom, formVazio, moeda, STATUS_USO, TIPOS } from '../utils/coupons';

const BASE = '/admin/cupons';
const LOJAS = '/api/v1/admin/dropshipping/stores';
const data = (v) => (v ? new Date(v).toLocaleString('pt-BR') : '—');
const erroDoServidor = (err, padrao) => ({ mensagem: err?.response?.data?.message || padrao, campos: err?.response?.data?.campos || [] });

/** Criar e editar. Em cupom já usado, código, tipo e valor ficam travados (o servidor também recusa). */
function FormularioCupom({ aberto, inicial, onFechar, onSalvo }) {
  const [f, setF] = useState(inicial);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [opcoes, setOpcoes] = useState([]);
  const [busca, setBusca] = useState('');
  useEffect(() => { setF(inicial); setErros({}); setErroGeral(''); }, [inicial, aberto]);
  useEffect(() => {
    if (!aberto) return undefined;
    let ativo = true;
    const t = setTimeout(() => {
      api.get(LOJAS, { params: { q: busca || undefined, pageSize: 50 } })
        .then((r) => { if (ativo) setOpcoes((r.data?.data ?? []).map((l) => ({ id: l.id, nome: l.nome, slug: l.slug }))); })
        .catch(() => { if (ativo) setOpcoes([]); });
    }, 250);
    return () => { ativo = false; clearTimeout(t); };
  }, [aberto, busca]);

  const set = (campo, valor) => setF((x) => ({ ...x, [campo]: valor }));
  const travado = !!f.id && f.jaUsado;
  const campo = (nome, rotulo, extra = {}) => (
    <TextField fullWidth size="small" label={rotulo} value={f[nome] ?? ''} onChange={(e) => set(nome, e.target.value)} error={!!erros[nome]} helperText={erros[nome]} {...extra} />
  );

  const salvar = async () => {
    const e = errosCupom(f);
    setErros(e);
    if (Object.keys(e).length) return;
    setSalvando(true); setErroGeral('');
    try {
      const corpo = corpoCupom(f);
      const r = f.id ? await api.patch(`${BASE}/${f.id}`, corpo) : await api.post(BASE, corpo);
      onSalvo(r.data);
    } catch (err) {
      const { mensagem, campos } = erroDoServidor(err, 'Não foi possível salvar o cupom.');
      setErros(Object.fromEntries(campos.map((c) => [c === 'lojaIds' ? 'lojas' : c, mensagem]))); setErroGeral(mensagem);
    } finally { setSalvando(false); }
  };

  return (
    <Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="sm">
      <DialogTitle>{f.id ? 'Editar cupom' : 'Novo cupom'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          {travado && <Grid item xs={12}><Alert severity="info">Cupom já usado: código, tipo e valor não podem mudar. Os pedidos já feitos mantêm o desconto gravado.</Alert></Grid>}
          <Grid item xs={12} sm={6}>{campo('codigo', 'Código', { disabled: travado, inputProps: { maxLength: 32 } })}</Grid>
          <Grid item xs={6} sm={3}>
            <TextField select fullWidth size="small" label="Tipo" value={f.tipo} disabled={travado} onChange={(e) => set('tipo', e.target.value)}>
              {Object.entries(TIPOS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>{campo('valor', f.tipo === 'PERCENTUAL' ? 'Percentual' : 'Valor (R$)', { disabled: travado })}</Grid>
          <Grid item xs={6}>{campo('validoDe', 'Início', { type: 'datetime-local', InputLabelProps: { shrink: true } })}</Grid>
          <Grid item xs={6}>{campo('validoAte', 'Fim', { type: 'datetime-local', InputLabelProps: { shrink: true } })}</Grid>
          <Grid item xs={6}>{campo('quantidadeTotal', 'Quantidade de usos', { type: 'number', inputProps: { min: 1 } })}</Grid>
          <Grid item xs={6}>{campo('valorMinimo', 'Valor mínimo dos itens (R$, opcional)')}</Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple size="small" options={opcoes} value={f.lojas} filterOptions={(o) => o}
              getOptionLabel={(l) => l.nome ?? `Loja #${l.id}`} isOptionEqualToValue={(a, b) => a.id === b.id}
              onChange={(_, v) => set('lojas', v)} onInputChange={(_, v, motivo) => { if (motivo === 'input') setBusca(v); }}
              renderInput={(p) => <TextField {...p} label="Lojas em que vale" error={!!erros.lojas} helperText={erros.lojas} />}
            />
          </Grid>
          <Grid item xs={12}>
            <Alert severity="warning" data-testid="aviso-comissoes">
              O desconto reduz o preço pago pelos itens: comissões do dropshipper e da plataforma e a taxa do gateway são calculadas sobre o valor depois do desconto, então
              produtor e dropshipper recebem menos nos pedidos com este cupom. O frete não recebe desconto.
            </Alert>
          </Grid>
          {erroGeral && <Grid item xs={12}><Alert severity="error">{erroGeral}</Alert></Grid>}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Cancelar</Button>
        <Button variant="contained" onClick={salvar} disabled={salvando}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}

/** Detalhe: usos consumidos, reservados, saldo e a lista de usos com pedido, loja e desconto. */
function DetalheCupom({ cupom, onFechar }) {
  const [d, setD] = useState(null);
  const [erro, setErro] = useState('');
  useEffect(() => {
    let ativo = true;
    api.get(`${BASE}/${cupom.id}/usos`).then((r) => { if (ativo) setD(r.data); }).catch(() => { if (ativo) setErro('Não foi possível carregar os usos.'); });
    return () => { ativo = false; };
  }, [cupom.id]);
  return (
    <Dialog open onClose={onFechar} fullWidth maxWidth="md">
      <DialogTitle>Usos do cupom {cupom.codigo}</DialogTitle>
      <DialogContent>
        {erro && <Alert severity="error">{erro}</Alert>}
        {!d && !erro && <CircularProgress size={24} />}
        {d && (
          <>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }} data-testid="resumo-usos">
              <Chip label={`Total: ${d.cupom.quantidadeTotal}`} />
              <Chip color="success" label={`Consumidos: ${d.cupom.consumidos}`} />
              <Chip color="info" label={`Reservados: ${d.cupom.reservados}`} />
              <Chip variant="outlined" label={`Saldo: ${d.cupom.saldo}`} />
            </Box>
            {d.usos.length === 0 ? <Typography color="text.secondary">Nenhum uso ainda.</Typography> : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead><TableRow><TableCell>Data</TableCell><TableCell>Loja</TableCell><TableCell>Pedido</TableCell><TableCell>Situação</TableCell><TableCell align="right">Desconto</TableCell></TableRow></TableHead>
                  <TableBody>
                    {d.usos.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{data(u.data)}</TableCell><TableCell>{u.lojaNome ?? `#${u.lojaId}`}</TableCell>
                        <TableCell>{u.pedidoId ? `#${u.pedidoId}` : '—'}</TableCell><TableCell>{STATUS_USO[u.status] ?? u.status}</TableCell>
                        <TableCell align="right">{moeda(u.descontoCents)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onFechar}>Fechar</Button></DialogActions>
    </Dialog>
  );
}

export function Coupons() {
  const [cupons, setCupons] = useState(null);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [nomes, setNomes] = useState(new Map());

  const carregar = useCallback(async () => {
    try {
      const r = await api.get(BASE);
      setCupons(r.data); setErro('');
      // Nomes das lojas para mostrar na edição (a lista de cupons traz só os ids).
      const ids = [...new Set(r.data.flatMap((c) => c.lojaIds))];
      if (ids.length) {
        const l = await api.get(LOJAS, { params: { pageSize: 100 } }).catch(() => null);
        setNomes(new Map((l?.data?.data ?? []).map((x) => [x.id, { id: x.id, nome: x.nome, slug: x.slug }])));
      }
    } catch { setErro('Não foi possível carregar os cupons.'); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const alternar = async (c) => {
    try { await api.post(`${BASE}/${c.id}/${c.ativo ? 'pausar' : 'reativar'}`); await carregar(); } catch (err) { setErro(erroDoServidor(err, 'A ação não pôde ser feita.').mensagem); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Cupons de desconto</Typography>
        <Button variant="contained" onClick={() => setForm(formVazio())}>Novo cupom</Button>
      </Box>
      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
      {cupons === null && !erro && <CircularProgress size={24} />}
      {cupons?.length === 0 && <Typography color="text.secondary">Nenhum cupom criado.</Typography>}
      {cupons?.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell><TableCell>Desconto</TableCell><TableCell>Validade</TableCell><TableCell>Lojas</TableCell>
                <TableCell>Usos</TableCell><TableCell>Situação</TableCell><TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cupons.map((c) => {
                const st = estadoDoCupom(c);
                return (
                  <TableRow key={c.id} hover>
                    <TableCell><strong>{c.codigo}</strong></TableCell>
                    <TableCell>{descricaoValor(c)}{c.valorMinimoCents ? ` · mín. ${moeda(c.valorMinimoCents)}` : ''}</TableCell>
                    <TableCell>{data(c.validoDe)} – {data(c.validoAte)}</TableCell>
                    <TableCell>{c.lojaIds.length}</TableCell>
                    <TableCell>{c.consumidos + c.reservados}/{c.quantidadeTotal}</TableCell>
                    <TableCell><Chip size="small" color={st.cor} label={st.rotulo} /></TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => setDetalhe(c)}>Usos</Button>
                      <Button size="small" onClick={() => setForm(formDoCupom(c, nomes))}>Editar</Button>
                      <Button size="small" color={c.ativo ? 'warning' : 'success'} onClick={() => alternar(c)}>{c.ativo ? 'Pausar' : 'Reativar'}</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {form && <FormularioCupom aberto inicial={form} onFechar={() => setForm(null)} onSalvo={() => { setForm(null); carregar(); }} />}
      {detalhe && <DetalheCupom cupom={detalhe} onFechar={() => setDetalhe(null)} />}
    </Box>
  );
}
