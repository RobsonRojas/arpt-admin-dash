import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../../services/api';
import { BASE, SITUACAO_ESPECIE, mensagemErro } from '../../utils/wood';
import { ReasonDialog } from './ReasonDialog';
import { EspeciePicker } from './EspeciePicker';

const VAZIA = { nome_cientifico: '', nome_principal_pt: '', nome_principal_en: '', nomes_populares: [''], descricao_pt: '', descricao_en: '', foto_url: '', foto_autor: '', foto_licenca: '', foto_fonte_url: '', foto_conferida: false, situacao: 'PERMITIDA', nota_exportacao: '', motivo_bloqueio: '', ativo: true };
export const AVISO_BLOQUEIO = 'Bloquear esta espécie tira de venda, agora, os produtos aprovados que a usam, e o produtor é avisado. Confirme só se for isso mesmo.';

export function SpeciesForm({ inicial, onSaved, onClose }) {
    const [f, setF] = useState(() => ({ ...VAZIA, ...inicial, nomes_populares: inicial?.nomes_populares?.length ? inicial.nomes_populares : [''] }));
    const [erro, setErro] = useState(null);
    const [confirmaBloqueio, setConfirmaBloqueio] = useState(false);
    const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
    // Trocar a URL da foto limpa o crédito e a conferência (eram da foto anterior); voltar à URL original os restaura.
    const trocarFoto = (e) => {
        const v = e.target.value;
        setF((x) => (v.trim() !== (inicial?.foto_url ?? '')
            ? { ...x, foto_url: v, foto_autor: '', foto_licenca: '', foto_fonte_url: '', foto_conferida: false }
            : { ...x, foto_url: v, foto_autor: inicial?.foto_autor ?? '', foto_licenca: inicial?.foto_licenca ?? '', foto_fonte_url: inicial?.foto_fonte_url ?? '', foto_conferida: !!inicial?.foto_conferida }));
    };
    const bloqueando = f.situacao === 'BLOQUEADA' && inicial?.situacao !== 'BLOQUEADA';
    const populares = f.nomes_populares.map((n) => n.trim()).filter(Boolean);

    const salvar = async () => {
        setErro(null);
        if (!f.nome_cientifico.trim() || !f.nome_principal_pt.trim()) return setErro('Informe o nome científico e o nome principal.');
        if (populares.length === 0) return setErro('Informe pelo menos um nome popular.');
        if (f.situacao === 'BLOQUEADA' && !f.motivo_bloqueio.trim()) return setErro('Informe o motivo do bloqueio.');
        if (bloqueando && !confirmaBloqueio) { setConfirmaBloqueio(true); return; }
        const corpo = {
            nome_cientifico: f.nome_cientifico.trim(), nome_principal_pt: f.nome_principal_pt.trim(), nome_principal_en: f.nome_principal_en?.trim() || null, nomes_populares: populares,
            descricao_pt: f.descricao_pt?.trim() || null, descricao_en: f.descricao_en?.trim() || null, foto_url: f.foto_url?.trim() || null, foto_autor: f.foto_autor?.trim() || null, foto_licenca: f.foto_licenca?.trim() || null,
            foto_fonte_url: f.foto_fonte_url?.trim() || null, foto_conferida: !!f.foto_conferida, situacao: f.situacao,
            nota_exportacao: f.nota_exportacao?.trim() || null, motivo_bloqueio: f.situacao === 'BLOQUEADA' ? f.motivo_bloqueio.trim() : null,
        };
        try {
            if (inicial?.id) await api.patch(`${BASE}/species/${inicial.id}`, { ...corpo, ativo: f.ativo });
            else await api.post(`${BASE}/species`, corpo);
            onSaved();
        } catch (e) { setErro(mensagemErro(e)); setConfirmaBloqueio(false); }
    };

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{inicial?.id ? 'Editar espécie' : 'Nova espécie'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {erro && <Alert severity="error">{erro}</Alert>}
                    {confirmaBloqueio && <Alert severity="warning">{AVISO_BLOQUEIO} Clique em "Confirmar bloqueio" para seguir.</Alert>}
                    <TextField label="Nome científico" value={f.nome_cientifico} onChange={set('nome_cientifico')} />
                    <TextField label="Nome principal (pt)" value={f.nome_principal_pt} onChange={set('nome_principal_pt')} />
                    <TextField label="Nome principal (en)" value={f.nome_principal_en ?? ''} onChange={set('nome_principal_en')} />
                    <Box>
                        <Typography variant="subtitle2">Nomes populares (pelo menos um)</Typography>
                        {f.nomes_populares.map((n, i) => (
                            <Stack key={i} direction="row" spacing={1} sx={{ mt: 1 }}>
                                <TextField size="small" fullWidth label={`Nome popular ${i + 1}`} value={n} onChange={(e) => setF((x) => ({ ...x, nomes_populares: x.nomes_populares.map((v, j) => (j === i ? e.target.value : v)) }))} />
                                <Button disabled={f.nomes_populares.length === 1} onClick={() => setF((x) => ({ ...x, nomes_populares: x.nomes_populares.filter((_, j) => j !== i) }))}>Remover</Button>
                            </Stack>
                        ))}
                        <Button onClick={() => setF((x) => ({ ...x, nomes_populares: [...x.nomes_populares, ''] }))}>Adicionar nome</Button>
                    </Box>
                    <TextField label="Descrição (pt)" multiline value={f.descricao_pt ?? ''} onChange={set('descricao_pt')} inputProps={{ maxLength: 400 }} />
                    <TextField label="Descrição (en)" multiline value={f.descricao_en ?? ''} onChange={set('descricao_en')} inputProps={{ maxLength: 400 }} />
                    <TextField label="Foto (URL)" value={f.foto_url ?? ''} onChange={trocarFoto} helperText="Ao trocar a foto, o crédito da anterior é apagado: informe o crédito da nova." />
                    {f.foto_url && (
                        <Stack spacing={2} data-testid="foto-credito" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                            <Box component="img" src={f.foto_url} alt="Prévia da foto" sx={{ maxWidth: 240, maxHeight: 160, objectFit: 'cover', borderRadius: 1 }} />
                            <Typography variant="caption" color="text.secondary">
                                Foto de base pública exige mostrar autor e licença junto da imagem. O crédito é da foto atual: ao trocar a URL ele é limpo.
                            </Typography>
                            <TextField label="Autor da foto" value={f.foto_autor ?? ''} onChange={set('foto_autor')} inputProps={{ maxLength: 300 }} />
                            <TextField label="Licença da foto" value={f.foto_licenca ?? ''} onChange={set('foto_licenca')} helperText="Por exemplo: CC BY 4.0, CC0, Domínio público" inputProps={{ maxLength: 60 }} />
                            <TextField label="Página da imagem na origem" value={f.foto_fonte_url ?? ''} onChange={set('foto_fonte_url')} inputProps={{ maxLength: 500 }} />
                            <FormControlLabel control={<Switch checked={!!f.foto_conferida} onChange={(e) => setF((x) => ({ ...x, foto_conferida: e.target.checked }))} />} label="Foto conferida pelo especialista (mostra a espécie certa)" />
                        </Stack>
                    )}
                    <FormControl>
                        <InputLabel id="sit">Situação</InputLabel>
                        <Select labelId="sit" label="Situação" value={f.situacao} onChange={set('situacao')}>
                            {Object.entries(SITUACAO_ESPECIE).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                        </Select>
                    </FormControl>
                    {f.situacao === 'EXIGE_CITES' && <TextField label="Nota de exportação" value={f.nota_exportacao ?? ''} onChange={set('nota_exportacao')} />}
                    {f.situacao === 'BLOQUEADA' && <TextField label="Motivo do bloqueio" value={f.motivo_bloqueio ?? ''} onChange={set('motivo_bloqueio')} />}
                    {inicial?.id && <FormControlLabel control={<Switch checked={f.ativo} onChange={(e) => setF((x) => ({ ...x, ativo: e.target.checked }))} />} label="Ativa" />}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={salvar}>{confirmaBloqueio ? 'Confirmar bloqueio' : 'Salvar'}</Button>
            </DialogActions>
        </Dialog>
    );
}

function Pedidos() {
    const [lista, setLista] = useState(null);
    const [erro, setErro] = useState(null);
    const [vinculo, setVinculo] = useState({});
    const [recusando, setRecusando] = useState(null);
    const carregar = useCallback(() => api.get(`${BASE}/species/requests`, { params: { situacao: 'PENDENTE' } }).then((r) => setLista(r.data.pedidos)).catch((e) => setErro(mensagemErro(e))), []);
    useEffect(() => { carregar(); }, [carregar]);
    const decidir = async (id, corpo) => {
        setErro(null);
        try { await api.post(`${BASE}/species/requests/${id}/decision`, corpo); setRecusando(null); carregar(); } catch (e) { setErro(mensagemErro(e)); }
    };
    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6">Pedidos de inclusão de espécie</Typography>
            {erro && <Alert severity="error" sx={{ my: 1 }}>{erro}</Alert>}
            {lista && lista.length === 0 && <Typography color="text.secondary">Nenhum pedido pendente.</Typography>}
            {(lista ?? []).map((p) => (
                <Stack key={p.id} direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 220 }}>{p.nome_popular}{p.nome_cientifico ? ` (${p.nome_cientifico})` : ''}</Typography>
                    <EspeciePicker sx={{ minWidth: 320 }} label="Vincular a" value={vinculo[p.id] ?? null} onChange={(v) => setVinculo((x) => ({ ...x, [p.id]: v }))} />
                    <Button size="small" disabled={!vinculo[p.id]} onClick={() => decidir(p.id, { decisao: 'ATENDIDO', especie_id: vinculo[p.id].id })}>Atender</Button>
                    <Button size="small" color="error" onClick={() => setRecusando(p.id)}>Recusar</Button>
                </Stack>
            ))}
            {recusando && <ReasonDialog titulo="Recusar pedido" descricao="O produtor recebe o motivo." confirmar="Recusar" onClose={() => setRecusando(null)} onConfirm={(m) => decidir(recusando, { decisao: 'RECUSADO', motivo: m })} />}
        </Box>
    );
}

/** Lista de espécies de madeira e pedidos de inclusão. */
export function WoodSpecies() {
    const [lista, setLista] = useState(null);
    const [erro, setErro] = useState(null);
    const [editando, setEditando] = useState(null);
    const [pagina, setPagina] = useState(0);
    const [porPagina, setPorPagina] = useState(50);
    const [busca, setBusca] = useState('');
    const [termo, setTermo] = useState('');
    useEffect(() => { const t = setTimeout(() => { setTermo(busca.trim()); setPagina(0); }, 350); return () => clearTimeout(t); }, [busca]);
    const carregar = useCallback(() => api.get(`${BASE}/species`, { params: { q: termo || undefined, pagina: pagina + 1, por_pagina: porPagina } })
        .then((r) => { setLista(r.data); setErro(null); }).catch((e) => setErro(mensagemErro(e, 'Não foi possível carregar as espécies.'))), [termo, pagina, porPagina]);
    useEffect(() => { carregar(); }, [carregar]);
    const especies = lista?.especies ?? [];
    return (
        <Box>
            {lista && lista.ativas === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }} role="alert">
                    Não há nenhuma espécie ativa. O produtor não consegue escolher a madeira no formulário de origem. Carregue a lista de espécies (script de carga) ou ative espécies cadastradas.
                </Alert>
            )}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Button variant="contained" onClick={() => setEditando({})}>Nova espécie</Button>
                <TextField size="small" label="Buscar espécie" placeholder="nome popular ou científico" value={busca} onChange={(e) => setBusca(e.target.value)} sx={{ minWidth: 280 }} />
                {lista && <Typography variant="body2" color="text.secondary">{lista.total ?? especies.length} espécie(s){lista.ativas !== undefined ? ` · ${lista.ativas} ativa(s) no total` : ''}</Typography>}
            </Stack>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            {!lista && !erro && <CircularProgress size={22} />}
            {lista && (
                <>
                <Table size="small">
                    <TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Científico</TableCell><TableCell>Nomes populares</TableCell><TableCell>Situação</TableCell><TableCell>Foto</TableCell><TableCell /></TableRow></TableHead>
                    <TableBody>
                        {especies.map((e) => (
                            <TableRow key={e.id}>
                                <TableCell>{e.nome_principal_pt}{!e.ativo && <Chip size="small" label="inativa" sx={{ ml: 1 }} />}</TableCell>
                                <TableCell><i>{e.nome_cientifico}</i></TableCell>
                                <TableCell>{(e.nomes_populares ?? []).join(', ')}</TableCell>
                                <TableCell><Chip size="small" color={e.situacao === 'BLOQUEADA' ? 'error' : e.situacao === 'EXIGE_CITES' ? 'warning' : 'default'} label={SITUACAO_ESPECIE[e.situacao]} /></TableCell>
                                <TableCell data-testid={`foto-${e.id}`}>
                                    {!e.foto_url ? <Chip size="small" label="sem foto" /> : e.foto_conferida ? <Chip size="small" color="success" label="conferida" /> : <Chip size="small" color="warning" label="a conferir" />}
                                </TableCell>
                                <TableCell><Button size="small" onClick={() => setEditando(e)}>Editar</Button></TableCell>
                            </TableRow>
                        ))}
                        {especies.length === 0 && <TableRow><TableCell colSpan={6}><Typography color="text.secondary">{termo ? 'Nenhuma espécie encontrada para essa busca.' : 'Nenhuma espécie cadastrada.'}</Typography></TableCell></TableRow>}
                    </TableBody>
                </Table>
                <TablePagination component="div" count={lista.total ?? especies.length} page={pagina} rowsPerPage={porPagina} rowsPerPageOptions={[25, 50, 100]}
                    onPageChange={(_, p) => setPagina(p)} onRowsPerPageChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(0); }} labelRowsPerPage="Por página" />
                </>
            )}
            {editando && <SpeciesForm inicial={editando.id ? editando : undefined} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); carregar(); }} />}
            <Pedidos />
        </Box>
    );
}
