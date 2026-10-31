import { useCallback, useEffect, useState } from 'react';
import {
    Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
    InputLabel, MenuItem, Paper, Select, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
    Tabs, TextField, Typography,
} from '@mui/material';
import { api } from '../services/api';
import {
    avisoReinicio, dataHora, duracaoDesde, erroMotivo, ESTADOS_JOB, estadoServico, LIMITE_LOTE, MOTIVO_MAX, mensagemServidor,
    resumoAcaoFila, rotuloEstadoJob,
} from '../utils/monitoring';
import { NotificacoesMonitoramento } from '../components/NotificacoesMonitoramento';

const BASE = '/api/v1/admin/monitoring';
const ATUALIZAR_MS = 30_000;

/** Estado dos serviços da stack e reinício controlado (só os permitidos, com confirmação e motivo). */
export const ServicosTab = () => {
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState(null);
    const [alvo, setAlvo] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [enviando, setEnviando] = useState(false);

    const carregar = useCallback(async () => {
        try {
            const r = await api.get(`${BASE}/services`);
            setDados(r.data); setErro('');
        } catch (err) {
            setErro(mensagemServidor(err, 'Não foi possível carregar o estado dos serviços.'));
        }
    }, []);

    useEffect(() => {
        carregar();
        const t = setInterval(carregar, ATUALIZAR_MS);
        return () => clearInterval(t);
    }, [carregar]);

    const abrir = (nome) => { setAlvo(nome); setMotivo(''); setAviso(null); };
    const problemaMotivo = erroMotivo(motivo);

    const reiniciar = async () => {
        const nome = alvo;
        setEnviando(true);
        try {
            await api.post(`${BASE}/containers/${encodeURIComponent(nome)}/restart`, { confirm: true, motivo: motivo.trim() });
            setAviso({ tipo: 'success', texto: `Reinício de ${nome} pedido. O estado se atualiza na próxima verificação (até 1 minuto).` });
        } catch (err) {
            setAviso({ tipo: err?.response?.status === 504 ? 'warning' : 'error', texto: mensagemServidor(err, `Não foi possível reiniciar ${nome}.`) });
        } finally {
            setEnviando(false); setAlvo(null);
            carregar();
        }
    };

    if (!dados) return erro ? <Alert severity="error">{erro}</Alert> : <Box p={3} textAlign="center"><CircularProgress size={28} /></Box>;

    return (
        <Box>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            {aviso && <Alert severity={aviso.tipo} sx={{ mb: 2 }} onClose={() => setAviso(null)}>{aviso.texto}</Alert>}
            {!dados.monitoramento_ligado && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Monitoramento desligado: o servidor não está ligado ao proxy do Docker. Os estados abaixo não são atualizados e o reinício fica indisponível.
                </Alert>
            )}
            {dados.monitoramento_ligado && !dados.alertas_ligados && (
                <Alert severity="info" sx={{ mb: 2 }}>Em observação: os estados são verificados, mas nenhum alerta de queda é enviado ainda.</Alert>
            )}
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Serviço</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Há quanto tempo</TableCell>
                            <TableCell>Último erro</TableCell>
                            <TableCell>Verificado em</TableCell>
                            <TableCell align="right">Ação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {dados.servicos.map((s) => {
                            const e = estadoServico(s.estado);
                            return (
                                <TableRow key={s.nome} data-testid={`servico-${s.nome}`}>
                                    <TableCell>{s.nome}</TableCell>
                                    <TableCell><Chip size="small" color={e.cor} label={e.rotulo} /></TableCell>
                                    <TableCell>{duracaoDesde(s.estado_desde)}</TableCell>
                                    <TableCell sx={{ maxWidth: 280, wordBreak: 'break-word' }}>{s.ultimo_erro || '—'}</TableCell>
                                    <TableCell>{dataHora(s.verificado_em)}</TableCell>
                                    <TableCell align="right">
                                        {s.reiniciavel
                                            ? <Button size="small" color="warning" disabled={!dados.monitoramento_ligado} onClick={() => abrir(s.nome)}>Reiniciar</Button>
                                            : <Typography variant="caption" color="text.secondary">Não reiniciável pelo painel</Typography>}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={!!alvo} onClose={() => !enviando && setAlvo(null)} fullWidth maxWidth="sm">
                <DialogTitle>Reiniciar {alvo}?</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>{alvo && avisoReinicio(alvo)} O mesmo serviço só pode ser reiniciado de novo depois de 2 minutos.</Alert>
                    <TextField
                        autoFocus fullWidth multiline minRows={2} label="Motivo (fica registrado na auditoria)"
                        value={motivo} onChange={(e) => setMotivo(e.target.value)} inputProps={{ maxLength: MOTIVO_MAX + 20 }}
                        error={!!motivo && !!problemaMotivo} helperText={(motivo && problemaMotivo) || ' '}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAlvo(null)} disabled={enviando}>Cancelar</Button>
                    <Button color="warning" variant="contained" onClick={reiniciar} disabled={!!problemaMotivo || enviando}>Reiniciar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

/** Filas BullMQ: contagens, jobs por estado, reenfileirar falhos e limpar falhos ou concluídos (nunca os em execução). */
export const FilasTab = () => {
    const [filas, setFilas] = useState(null);
    const [fila, setFila] = useState('');
    const [estado, setEstado] = useState('failed');
    const [pagina, setPagina] = useState(0);
    const [jobs, setJobs] = useState(null);
    const [selecionados, setSelecionados] = useState([]);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');
    const [confirmar, setConfirmar] = useState(null); // { acao: 'retry' | 'clean', ids?: string[] }
    const TAMANHO = 20;

    const carregarFilas = useCallback(async () => {
        try {
            const r = await api.get(`${BASE}/queues`);
            setFilas(r.data?.filas ?? []);
            setFila((f) => f || r.data?.filas?.[0]?.nome || '');
        } catch (err) { setErro(mensagemServidor(err, 'Não foi possível carregar as filas.')); }
    }, []);

    const carregarJobs = useCallback(async () => {
        if (!fila) return;
        try {
            const r = await api.get(`${BASE}/queues/${encodeURIComponent(fila)}/jobs`, { params: { estado, pagina: pagina + 1, tamanho: TAMANHO } });
            setJobs(r.data); setSelecionados([]);
        } catch (err) { setErro(mensagemServidor(err, 'Não foi possível carregar os jobs.')); }
    }, [fila, estado, pagina]);

    useEffect(() => { carregarFilas(); }, [carregarFilas]);
    useEffect(() => { carregarJobs(); }, [carregarJobs]);

    const alternar = (id) => setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= LIMITE_LOTE ? s : [...s, id]));
    const podeAgir = estado === 'failed' || estado === 'completed';

    const executar = async () => {
        const { acao, ids } = confirmar;
        setConfirmar(null); setErro(''); setAviso('');
        try {
            const corpo = acao === 'retry' ? { confirm: true, ids } : { confirm: true, estado, ...(ids ? { ids } : {}) };
            const r = await api.post(`${BASE}/queues/${encodeURIComponent(fila)}/${acao}`, corpo);
            setAviso(resumoAcaoFila(r.data, acao));
        } catch (err) {
            setErro(mensagemServidor(err, 'A ação não foi concluída.'));
        }
        await Promise.all([carregarFilas(), carregarJobs()]);
    };

    const textoConfirmacao = () => {
        if (!confirmar) return '';
        if (confirmar.acao === 'retry') return `Reenfileirar ${confirmar.ids.length} job(s) falho(s) da fila ${fila}? Eles rodam de novo do começo.`;
        if (confirmar.ids) return `Remover ${confirmar.ids.length} job(s) ${rotuloEstadoJob(estado).toLowerCase()} da fila ${fila}? Não dá para desfazer.`;
        return `Remover TODOS os jobs ${rotuloEstadoJob(estado).toLowerCase()} da fila ${fila} (até 1000)? Não dá para desfazer. Jobs em execução nunca são removidos.`;
    };

    return (
        <Box>
            {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>{erro}</Alert>}
            {aviso && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAviso('')}>{aviso}</Alert>}
            {!filas ? (!erro && <Box p={3} textAlign="center"><CircularProgress size={28} /></Box>) : (
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Fila</TableCell>
                                {ESTADOS_JOB.map(([v, r]) => <TableCell key={v} align="right">{r}</TableCell>)}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filas.map((f) => (
                                <TableRow key={f.nome} hover selected={f.nome === fila} sx={{ cursor: 'pointer' }} onClick={() => { setFila(f.nome); setPagina(0); }} data-testid={`fila-${f.nome}`}>
                                    <TableCell>{f.nome}</TableCell>
                                    {ESTADOS_JOB.map(([v]) => (
                                        <TableCell key={v} align="right" sx={v === 'failed' && f.contagens?.[v] ? { color: 'error.main', fontWeight: 'bold' } : undefined}>{f.contagens?.[v] ?? 0}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {fila && (
                <Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
                        <Typography variant="h6">{fila}</Typography>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel id="estado-job">Estado</InputLabel>
                            <Select labelId="estado-job" label="Estado" value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(0); }}>
                                {ESTADOS_JOB.map(([v, r]) => <MenuItem key={v} value={v}>{r}</MenuItem>)}
                            </Select>
                        </FormControl>
                        {estado === 'failed' && (
                            <Button size="small" variant="contained" disabled={!selecionados.length} onClick={() => setConfirmar({ acao: 'retry', ids: selecionados })}>
                                Reenfileirar selecionados ({selecionados.length})
                            </Button>
                        )}
                        {podeAgir && (
                            <>
                                <Button size="small" color="error" disabled={!selecionados.length} onClick={() => setConfirmar({ acao: 'clean', ids: selecionados })}>
                                    Remover selecionados
                                </Button>
                                <Button size="small" color="error" variant="outlined" disabled={!jobs?.total} onClick={() => setConfirmar({ acao: 'clean' })}>
                                    Limpar todos os {rotuloEstadoJob(estado).toLowerCase()}
                                </Button>
                            </>
                        )}
                    </Box>
                    {podeAgir && <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Selecione até {LIMITE_LOTE} jobs por vez.</Typography>}
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {podeAgir && <TableCell padding="checkbox" />}
                                    <TableCell>Id</TableCell>
                                    <TableCell>Job</TableCell>
                                    <TableCell>Motivo da última falha</TableCell>
                                    <TableCell align="right">Tentativas</TableCell>
                                    <TableCell>Data</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(jobs?.jobs ?? []).map((j) => (
                                    <TableRow key={j.id}>
                                        {podeAgir && (
                                            <TableCell padding="checkbox">
                                                <Checkbox size="small" inputProps={{ 'aria-label': `Selecionar job ${j.id}` }} checked={selecionados.includes(j.id)} onChange={() => alternar(j.id)} />
                                            </TableCell>
                                        )}
                                        <TableCell>{j.id}</TableCell>
                                        <TableCell>{j.nome}</TableCell>
                                        <TableCell sx={{ maxWidth: 360, wordBreak: 'break-word' }}>{j.motivo || '—'}</TableCell>
                                        <TableCell align="right">{j.tentativas}</TableCell>
                                        <TableCell>{dataHora(j.data)}</TableCell>
                                    </TableRow>
                                ))}
                                {jobs && !jobs.jobs.length && (
                                    <TableRow><TableCell colSpan={6}><Typography variant="body2" color="text.secondary">Nenhum job neste estado.</Typography></TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div" count={jobs?.total ?? 0} page={pagina} rowsPerPage={TAMANHO} rowsPerPageOptions={[TAMANHO]}
                        onPageChange={(_e, p) => setPagina(p)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                    />
                </Box>
            )}

            <Dialog open={!!confirmar} onClose={() => setConfirmar(null)} fullWidth maxWidth="sm">
                <DialogTitle>Confirmar</DialogTitle>
                <DialogContent><Typography>{textoConfirmacao()}</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmar(null)}>Cancelar</Button>
                    <Button variant="contained" color={confirmar?.acao === 'retry' ? 'primary' : 'error'} onClick={executar}>Confirmar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export const Monitoring = () => {
    const [aba, setAba] = useState(0);
    return (
        <Box>
            <Typography variant="h4" gutterBottom>Monitoramento</Typography>
            <Typography color="text.secondary" paragraph>
                Estado dos serviços verificado a cada minuto. Cada reinício e cada ação nas filas fica registrado na auditoria, com o seu usuário e o motivo.
            </Typography>
            <NotificacoesMonitoramento />
            <Paper sx={{ mb: 2 }}>
                <Tabs value={aba} onChange={(_e, v) => setAba(v)}>
                    <Tab label="Serviços" />
                    <Tab label="Filas" />
                </Tabs>
            </Paper>
            {aba === 0 ? <ServicosTab /> : <FilasTab />}
        </Box>
    );
};
