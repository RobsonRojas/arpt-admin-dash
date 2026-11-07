import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import { api } from '../services/api';
import { PromocaoCampanha } from '../components/PromocaoCampanha';
import {
  acoesPermitidas, ALERTAS, ativacaoBloqueada, COR_ESTADO, corpoCampanha, errosCampanha, ESTADOS, ETAPAS, METAS, moeda, MOTIVOS_ENCERRAMENTO, percentual,
  previaCustoMaximo,
} from '../utils/growthCampaigns';

const BASE = '/admin/growth/campaigns';
const dia = (v) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—');
const paraInput = (v) => (v ? new Date(v).toISOString().slice(0, 16) : '');
const hojeInput = (dias = 0) => new Date(Date.now() + dias * 86400000).toISOString().slice(0, 16);
const FORM_VAZIO = () => ({
  nome: '', tipo: '', inicio: hojeInput(), fim: hojeInput(60), metaTipo: 'dropshipper_loja', metaValor: '',
  parametros: { passoPontos: '1', limiteComissaoTotal: '20', duracaoBonusMeses: '4', orcamentoTotal: '' },
});
const ACOES = {
  activate: { rotulo: 'Ativar', texto: 'Ativar a campanha? Os limites (meta, prazo e benefício) não poderão mais ser alterados.' },
  pause: { rotulo: 'Pausar', texto: 'Pausar a campanha? Nenhum benefício novo será concedido enquanto estiver pausada.' },
  resume: { rotulo: 'Retomar', texto: 'Retomar a campanha?' },
  close: { rotulo: 'Encerrar', texto: 'Encerrar a campanha? Esta ação é definitiva: uma campanha encerrada não volta a ficar ativa.' },
};

const erroDoServidor = (err, padrao) => ({ mensagem: err?.response?.data?.message || padrao, campos: err?.response?.data?.campos || {} });

/** Formulário de rascunho (criar e editar). Mostra o erro do servidor junto de cada campo. */
function FormularioCampanha({ aberto, inicial, tipos, comissaoInicial, onFechar, onSalvo }) {
  const [f, setF] = useState(inicial);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { setF(inicial); setErros({}); setErroGeral(''); }, [inicial, aberto]);

  const tipo = tipos.find((t) => t.tipo === f.tipo);
  const previa = useMemo(() => (tipo?.incentivo ? previaCustoMaximo(f.parametros, comissaoInicial) : null), [f.parametros, tipo, comissaoInicial]);
  const set = (campo, valor) => setF((x) => ({ ...x, [campo]: valor }));
  const setPar = (campo, valor) => setF((x) => ({ ...x, parametros: { ...x.parametros, [campo]: valor } }));
  const campo = (nome, rotulo, extra = {}) => (
    <TextField fullWidth size="small" label={rotulo} value={nome.startsWith('parametros.') ? f.parametros?.[nome.slice(11)] ?? '' : f[nome] ?? ''}
      onChange={(e) => (nome.startsWith('parametros.') ? setPar(nome.slice(11), e.target.value) : set(nome, e.target.value))}
      error={!!erros[nome]} helperText={erros[nome]} {...extra} />
  );

  const salvar = async () => {
    const e = errosCampanha(f, tipo);
    setErros(e);
    if (Object.keys(e).length) return;
    setSalvando(true); setErroGeral('');
    try {
      const corpo = corpoCampanha(f, tipo);
      const r = f.id ? await api.patch(`${BASE}/${f.id}`, corpo) : await api.post(BASE, corpo);
      onSalvo(r.data);
    } catch (err) {
      const { mensagem, campos } = erroDoServidor(err, 'Não foi possível salvar a campanha.');
      setErros(campos); setErroGeral(mensagem);
    } finally { setSalvando(false); }
  };

  return (
    <Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="sm">
      <DialogTitle>{f.id ? 'Editar rascunho' : 'Nova campanha'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>{campo('nome', 'Nome da campanha')}</Grid>
          <Grid item xs={12}>
            <TextField select fullWidth size="small" label="Mecanismo" value={f.tipo} disabled={!!f.id} error={!!erros.tipo} helperText={erros.tipo}
              onChange={(e) => { const t = tipos.find((x) => x.tipo === e.target.value); setF((x) => ({ ...x, tipo: e.target.value, metaTipo: t?.metas?.[0] ?? x.metaTipo })); }}>
              {tipos.map((t) => <MenuItem key={t.tipo} value={t.tipo}>{t.rotulo}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>{campo('inicio', 'Início', { type: 'datetime-local', InputLabelProps: { shrink: true } })}</Grid>
          <Grid item xs={6}>{campo('fim', 'Prazo (data final)', { type: 'datetime-local', InputLabelProps: { shrink: true } })}</Grid>
          <Grid item xs={6}>
            <TextField select fullWidth size="small" label="Tipo de meta" value={f.metaTipo} error={!!erros.metaTipo} helperText={erros.metaTipo} onChange={(e) => set('metaTipo', e.target.value)}>
              {(tipo?.metas ?? Object.keys(METAS)).map((m) => <MenuItem key={m} value={m}>{METAS[m]}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>{campo('metaValor', 'Meta (quantidade)', { type: 'number', inputProps: { min: 1 } })}</Grid>
          {tipo?.incentivo && (
            <>
              <Grid item xs={6}>{campo('parametros.passoPontos', 'Passo por indicado (p.p.)', { type: 'number' })}</Grid>
              <Grid item xs={6}>{campo('parametros.limiteComissaoTotal', 'Teto de comissão total por pessoa (%)', { type: 'number' })}</Grid>
              <Grid item xs={6}>{campo('parametros.duracaoBonusMeses', 'Duração de cada passo (meses)', { type: 'number' })}</Grid>
              <Grid item xs={6}>{campo('parametros.orcamentoTotal', 'Orçamento total (R$, opcional)', { type: 'number' })}</Grid>
              <Grid item xs={12}>
                <Alert severity="info" data-testid="previa-custo">
                  {previa
                    ? `Custo máximo por indicador: até ${String(previa.bonusMaximoPontos).replace('.', ',')} pontos percentuais sobre o preço de venda das vendas dele (${previa.passos} passo(s)), cada passo por ${previa.meses} mês(es).`
                    : 'Preencha passo, teto e duração para ver o custo máximo por indicador.'}
                </Alert>
              </Grid>
            </>
          )}
          {erroGeral && <Grid item xs={12}><Alert severity="error">{erroGeral}</Alert></Grid>}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Cancelar</Button>
        <Button variant="contained" onClick={salvar} disabled={salvando}>Salvar rascunho</Button>
      </DialogActions>
    </Dialog>
  );
}

/** Detalhe: progresso da meta, funil, custo por novo membro, retenção e evolução diária. */
function DetalheCampanha({ campanha, tipo, incentivosLigados, onFechar, onAcao, onEditar, onDuplicar }) {
  const [m, setM] = useState(null);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(null);
  const [erroAcao, setErroAcao] = useState('');
  const [aba, setAba] = useState(0);
  const permitidas = acoesPermitidas(campanha.estado);
  const bloqueadaPorChave = ativacaoBloqueada(tipo, incentivosLigados);

  useEffect(() => {
    let ativo = true;
    api.get(`${BASE}/${campanha.id}/metrics`).then((r) => { if (ativo) setM(r.data); }).catch(() => { if (ativo) setErro('Não foi possível carregar as métricas.'); });
    return () => { ativo = false; };
  }, [campanha.id, campanha.estado]);

  const executar = async () => {
    setErroAcao('');
    try { await onAcao(confirmando, campanha); setConfirmando(null); } catch (err) { setErroAcao(erroDoServidor(err, 'A ação não pôde ser feita.').mensagem); }
  };
  // O arquivo só tem números agregados; vai por aqui porque a rota exige o token do administrador.
  const exportar = async () => {
    try {
      const r = await api.get(`${BASE}/${campanha.id}/metrics/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url; a.download = `campanha-${campanha.id}-metricas.csv`; a.click(); URL.revokeObjectURL(url);
    } catch { setErro('Não foi possível exportar as métricas.'); }
  };
  const vazio = m && m.funil.every((f) => f.quantidade === 0) && m.novosCadastros === 0;

  return (
    <Dialog open onClose={onFechar} fullWidth maxWidth="md">
      <DialogTitle>
        {campanha.nome} <Chip size="small" label={ESTADOS[campanha.estado]} color={COR_ESTADO[campanha.estado]} sx={{ ml: 1 }} />
        {campanha.motivo_encerramento && <Chip size="small" label={MOTIVOS_ENCERRAMENTO[campanha.motivo_encerramento]} sx={{ ml: 1 }} />}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {permitidas.editar && <Button size="small" onClick={() => onEditar(campanha)}>Editar</Button>}
          {['activate', 'pause', 'resume', 'close'].map((a) => {
            const desabilitada = !permitidas[a] || (a === 'activate' && bloqueadaPorChave);
            const botao = <Button size="small" variant="outlined" disabled={desabilitada} onClick={() => setConfirmando(a)}>{ACOES[a].rotulo}</Button>;
            return a === 'activate' && bloqueadaPorChave
              ? <Tooltip key={a} title="A chave de incentivo financeiro está desligada."><span>{botao}</span></Tooltip>
              : <span key={a}>{botao}</span>;
          })}
          <Button size="small" variant="outlined" disabled={!permitidas.duplicate} onClick={() => onDuplicar(campanha)}>Duplicar</Button>
          <Button size="small" variant="outlined" onClick={exportar}>Exportar (CSV)</Button>
        </Box>
        <Tabs value={aba} onChange={(_, v) => setAba(v)} sx={{ mb: 2 }}><Tab label="Resultados" /><Tab label="Promoção" /></Tabs>
        {aba === 1 && <PromocaoCampanha campanha={campanha} tipo={tipo} />}
        {aba === 0 && erro && <Alert severity="error">{erro}</Alert>}
        {aba === 0 && !m && !erro && <CircularProgress size={24} />}
        {aba === 0 && m && (
          <>
            {m.alertas.map((a) => <Alert key={a} severity="warning" sx={{ mb: 1 }}>{ALERTAS[a]}</Alert>)}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {[
                ['Progresso da meta', `${m.meta.progresso} / ${m.meta.valor} (${String(m.meta.percentual).replace('.', ',')}%)`],
                ['Dias restantes', m.meta.diasRestantes],
                ['Novos cadastros', m.novosCadastros],
                ['Dropshippers com loja', m.novosDropshippersComLoja],
                ['Produtores com produto ativo', m.novosProdutoresAtivos],
                ...(m.incentivo ? [['Incentivo concedido', moeda(m.incentivo.totalConcedido)], ['Custo por novo membro', moeda(m.incentivo.custoPorNovoMembro)]] : []),
              ].map(([rotulo, valor]) => (
                <Grid item xs={6} md={3} key={rotulo}><Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">{rotulo}</Typography><Typography variant="h6">{valor}</Typography>
                </Paper></Grid>
              ))}
            </Grid>
            {vazio && <Alert severity="info" sx={{ mb: 2 }}>Ainda não há dados: a campanha só mede quem chega depois de ativada, com o link ou código da campanha.</Alert>}
            <Typography variant="subtitle1">Funil</Typography>
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead><TableRow><TableCell>Etapa</TableCell><TableCell align="right">Quantidade</TableCell><TableCell align="right">Taxa sobre a etapa anterior</TableCell></TableRow></TableHead>
              <TableBody>{m.funil.map((f) => (
                <TableRow key={f.etapa}><TableCell>{ETAPAS[f.etapa]}</TableCell><TableCell align="right">{f.quantidade}</TableCell><TableCell align="right">{percentual(f.taxaDaEtapaAnterior)}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
            <Typography variant="subtitle1">Retenção</Typography>
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead><TableRow><TableCell>Janela</TableCell><TableCell align="right">Ativos / elegíveis</TableCell><TableCell align="right">Taxa</TableCell><TableCell align="right">Fora da janela</TableCell></TableRow></TableHead>
              <TableBody>{[['30 dias', m.retencao.d30], ['90 dias', m.retencao.d90]].map(([r, v]) => (
                <TableRow key={r}><TableCell>{r}</TableCell><TableCell align="right">{v.ativos} / {v.elegiveis}</TableCell><TableCell align="right">{percentual(v.taxa)}</TableCell><TableCell align="right">{v.excluidos}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
            <Typography variant="subtitle1">Evolução diária</Typography>
            {m.evolucaoDiaria.length === 0 ? <Typography color="text.secondary">Sem registros diários ainda.</Typography> : (
              <Table size="small">
                <TableHead><TableRow><TableCell>Dia</TableCell>{Object.keys(ETAPAS).map((e) => <TableCell key={e} align="right">{ETAPAS[e]}</TableCell>)}</TableRow></TableHead>
                <TableBody>{m.evolucaoDiaria.map((d) => (
                  <TableRow key={d.dia}><TableCell>{dia(d.dia)}</TableCell>{Object.keys(ETAPAS).map((e) => <TableCell key={e} align="right">{d[e] ?? 0}</TableCell>)}</TableRow>
                ))}</TableBody>
              </Table>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onFechar}>Fechar</Button></DialogActions>
      <Dialog open={!!confirmando} onClose={() => setConfirmando(null)}>
        <DialogTitle>{confirmando && ACOES[confirmando].rotulo} campanha</DialogTitle>
        <DialogContent>
          <Typography>{confirmando && ACOES[confirmando].texto}</Typography>
          {erroAcao && <Alert severity="error" sx={{ mt: 2 }}>{erroAcao}</Alert>}
        </DialogContent>
        <DialogActions><Button onClick={() => setConfirmando(null)}>Voltar</Button><Button variant="contained" color={confirmando === 'close' ? 'error' : 'primary'} onClick={executar}>Confirmar</Button></DialogActions>
      </Dialog>
    </Dialog>
  );
}

/** Comparativo por mecanismo (inclui os sem campanha, com zeros) ou por campanha, num período. */
function Comparativo() {
  const [de, setDe] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [ate, setAte] = useState(new Date().toISOString().slice(0, 10));
  const [por, setPor] = useState('mecanismo');
  const [linhas, setLinhas] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [erro, setErro] = useState('');
  const carregar = async () => {
    setErro('');
    try {
      const [r, t] = await Promise.all([api.get(`${BASE}/compare`, { params: { de: `${de}T00:00:00`, ate: `${ate}T23:59:59`, por } }), api.get(`${BASE}/tipos`)]);
      setLinhas(r.data); setTipos(t.data);
    } catch { setErro('Não foi possível carregar o comparativo.'); setLinhas(null); }
  };
  const rotulo = (tipo) => tipos.find((t) => t.tipo === tipo)?.rotulo ?? tipo;
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" type="date" label="De" value={de} onChange={(e) => setDe(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="date" label="Até" value={ate} onChange={(e) => setAte(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField select size="small" label="Comparar por" value={por} onChange={(e) => setPor(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="mecanismo">Mecanismo</MenuItem><MenuItem value="campanha">Campanha</MenuItem>
        </TextField>
        <Button variant="contained" onClick={carregar}>Comparar</Button>
      </Box>
      {erro && <Alert severity="error">{erro}</Alert>}
      {linhas && (
        <TableContainer component={Paper} variant="outlined"><Table size="small">
          <TableHead><TableRow>
            <TableCell>{por === 'campanha' ? 'Campanha' : 'Mecanismo'}</TableCell>
            {por === 'mecanismo' && <TableCell align="right">Campanhas</TableCell>}
            <TableCell align="right">Novos membros</TableCell><TableCell align="right">Cumprimento da meta</TableCell><TableCell align="right">Incentivo</TableCell><TableCell align="right">Custo por novo membro</TableCell>
          </TableRow></TableHead>
          <TableBody>{linhas.map((l) => (
            <TableRow key={l.campanhaId ?? l.tipo}>
              <TableCell>{por === 'campanha' ? `${l.nome} (${rotulo(l.tipo)})` : rotulo(l.tipo)}</TableCell>
              {por === 'mecanismo' && <TableCell align="right">{l.campanhas}</TableCell>}
              <TableCell align="right">{l.novosMembros}</TableCell><TableCell align="right">{percentual(l.taxaCumprimentoMeta)}</TableCell>
              <TableCell align="right">{moeda(l.totalConcedido ?? l.concedido)}</TableCell><TableCell align="right">{moeda(l.custoPorNovoMembro)}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></TableContainer>
      )}
    </Box>
  );
}

export const GrowthCampaigns = () => {
  const [aba, setAba] = useState(0);
  const [campanhas, setCampanhas] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [config, setConfig] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [erro, setErro] = useState('');
  const [form, setForm] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroTipo) params.tipo = filtroTipo;
      const [c, t, s] = await Promise.all([api.get(BASE, { params }), api.get(`${BASE}/tipos`), api.get('/api/v1/admin/dropshipping/settings')]);
      setCampanhas(c.data); setTipos(t.data); setConfig(s.data);
    } catch { setErro('Não foi possível carregar as campanhas.'); setCampanhas(null); }
  }, [filtroEstado, filtroTipo]);
  useEffect(() => { carregar(); }, [carregar]);

  const incentivosLigados = !!config?.growthIncentivesEnabled;
  const rotuloTipo = (tipo) => tipos.find((t) => t.tipo === tipo)?.rotulo ?? tipo;

  const acao = async (nome, c) => {
    const r = await api.post(`${BASE}/${c.id}/${nome}`);
    setDetalhe(r.data); await carregar();
  };
  const duplicar = async (c) => {
    const inicio = new Date(), fim = new Date(Date.now() + 60 * 86400000);
    const r = await api.post(`${BASE}/${c.id}/duplicate`, { inicio: inicio.toISOString(), fim: fim.toISOString() });
    setDetalhe(null); await carregar(); setForm(formDe(r.data));
  };
  const formDe = (c) => ({
    id: c.id, nome: c.nome, tipo: c.tipo, inicio: paraInput(c.inicio), fim: paraInput(c.fim), metaTipo: c.meta_tipo, metaValor: String(c.meta_valor),
    parametros: { passoPontos: '', limiteComissaoTotal: '', duracaoBonusMeses: '', orcamentoTotal: '', ...Object.fromEntries(Object.entries(c.parametros ?? {}).map(([k, v]) => [k, String(v)])) },
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Campanhas de crescimento</Typography>
        <Button variant="contained" onClick={() => setForm(FORM_VAZIO())}>Nova campanha</Button>
      </Box>
      <Typography variant="body2" color="text.secondary" paragraph>
        Toda campanha tem prazo e meta. Ela encerra sozinha no prazo ou ao atingir a meta, o que vier primeiro, e é avaliada pelo aumento da base de dropshippers com loja online e de produtores com produto ativo.
      </Typography>
      {config && !incentivosLigados && (
        <Alert severity="warning" sx={{ mb: 2 }} data-testid="aviso-chave">
          A chave de incentivo financeiro está desligada: campanhas com incentivo (como o bônus de comissão por indicação) podem ser criadas em rascunho, mas não podem ser ativadas.
        </Alert>
      )}
      <Tabs value={aba} onChange={(_, v) => setAba(v)} sx={{ mb: 2 }}><Tab label="Campanhas" /><Tab label="Comparativo" /></Tabs>
      {aba === 1 && <Comparativo />}
      {aba === 0 && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField select size="small" label="Estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="">Todos</MenuItem>{Object.entries(ESTADOS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Mecanismo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} sx={{ minWidth: 240 }}>
              <MenuItem value="">Todos</MenuItem>{tipos.map((t) => <MenuItem key={t.tipo} value={t.tipo}>{t.rotulo}</MenuItem>)}
            </TextField>
          </Box>
          {erro && <Alert severity="error">{erro}</Alert>}
          {!campanhas && !erro && <CircularProgress size={24} />}
          {campanhas && (
            <TableContainer component={Paper} variant="outlined"><Table size="small">
              <TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Mecanismo</TableCell><TableCell>Estado</TableCell><TableCell>Período</TableCell><TableCell align="right">Meta</TableCell><TableCell>Alerta</TableCell></TableRow></TableHead>
              <TableBody>
                {campanhas.length === 0 && <TableRow><TableCell colSpan={6} align="center">Nenhuma campanha. Use “Nova campanha” para criar a primeira, sempre com prazo e meta.</TableCell></TableRow>}
                {campanhas.map((c) => (
                  <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => setDetalhe(c)}>
                    <TableCell>{c.nome}</TableCell><TableCell>{rotuloTipo(c.tipo)}</TableCell>
                    <TableCell><Chip size="small" label={ESTADOS[c.estado]} color={COR_ESTADO[c.estado]} /></TableCell>
                    <TableCell>{dia(c.inicio)} a {dia(c.fim)}</TableCell>
                    <TableCell align="right">{c.progresso} / {c.meta_valor}</TableCell>
                    <TableCell>{(c.alertas ?? []).length ? c.alertas.map((a) => <Chip key={a} size="small" color="warning" label={ALERTAS[a]} sx={{ mr: 0.5 }} />) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></TableContainer>
          )}
        </>
      )}
      {form && (
        <FormularioCampanha aberto inicial={form} tipos={tipos} comissaoInicial={config?.dropshipperCommissionPercent ?? 0}
          onFechar={() => setForm(null)} onSalvo={(c) => { setForm(null); carregar(); setDetalhe(c); }} />
      )}
      {detalhe && (
        <DetalheCampanha campanha={detalhe} tipo={tipos.find((t) => t.tipo === detalhe.tipo)} incentivosLigados={incentivosLigados}
          onFechar={() => setDetalhe(null)} onAcao={acao} onDuplicar={duplicar}
          onEditar={(c) => { setDetalhe(null); setForm(formDe(c)); }} />
      )}
    </Box>
  );
};
