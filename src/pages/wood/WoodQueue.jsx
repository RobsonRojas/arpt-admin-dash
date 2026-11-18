import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { api } from '../../services/api';
import { BASE, TIPO_ORIGEM, formatarData, mensagemErro } from '../../utils/wood';

/** Fila de análise: declarações e documentos em análise, da mais antiga para a mais nova. */
export function WoodQueue({ onOpen }) {
    const [filtros, setFiltros] = useState({ tipo: '', tipo_origem: '', sem_comprovante_fiscal: false, especie_a_confirmar: false });
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState(null);
    const [amostra, setAmostra] = useState(null);

    const carregar = useCallback(async () => {
        setErro(null); setDados(null);
        const params = { limite: 100 };
        if (filtros.tipo) params.tipo = filtros.tipo;
        if (filtros.tipo_origem) params.tipo_origem = filtros.tipo_origem;
        if (filtros.sem_comprovante_fiscal) params.sem_comprovante_fiscal = true;
        if (filtros.especie_a_confirmar) params.especie_a_confirmar = true;
        try { setDados((await api.get(`${BASE}/queue`, { params })).data); } catch (e) { setErro(mensagemErro(e, 'Não foi possível carregar a fila.')); }
    }, [filtros]);
    useEffect(() => { carregar(); }, [carregar]);

    const sortear = async () => {
        try { setAmostra((await api.get(`${BASE}/sample`, { params: { n: 10 } })).data.itens); } catch (e) { setErro(mensagemErro(e)); }
    };
    const set = (k) => (e) => setFiltros((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    return (
        <Box>
            <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center" sx={{ mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel id="f-tipo">Tipo</InputLabel>
                    <Select labelId="f-tipo" label="Tipo" value={filtros.tipo} onChange={set('tipo')}>
                        <MenuItem value="">Todos</MenuItem><MenuItem value="DECLARACAO">Declarações</MenuItem><MenuItem value="DOCUMENTO">Documentos</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id="f-origem">Origem</InputLabel>
                    <Select labelId="f-origem" label="Origem" value={filtros.tipo_origem} onChange={set('tipo_origem')}>
                        <MenuItem value="">Todas</MenuItem>
                        {Object.entries(TIPO_ORIGEM).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControlLabel control={<Switch checked={filtros.sem_comprovante_fiscal} onChange={set('sem_comprovante_fiscal')} />} label="Sem comprovante fiscal" />
                <FormControlLabel control={<Switch checked={filtros.especie_a_confirmar} onChange={set('especie_a_confirmar')} />} label="Espécie a confirmar" />
                <Button onClick={carregar}>Atualizar</Button>
                <Button onClick={sortear}>Amostra de aprovadas</Button>
            </Stack>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            {!dados && !erro && <CircularProgress size={22} />}
            {dados && (dados.itens.length === 0
                ? <Typography color="text.secondary">Nada em análise.</Typography>
                : (
                    <Table size="small">
                        <TableHead><TableRow><TableCell>Desde</TableCell><TableCell>Item</TableCell><TableCell>Produtor</TableCell><TableCell>Origem</TableCell><TableCell>Alertas</TableCell><TableCell /></TableRow></TableHead>
                        <TableBody>
                            {dados.itens.map((i) => (
                                <TableRow key={`${i.tipo}-${i.id}-${i.versao ?? ''}`} hover>
                                    <TableCell>{formatarData(i.desde)}</TableCell>
                                    <TableCell>{i.tipo === 'DECLARACAO' ? `Declaração · ${i.produto}` : `Documento ${i.tipo_documento}${i.numero ? ` nº ${i.numero}` : ''} (v${i.versao})`}</TableCell>
                                    <TableCell>{i.produtor}</TableCell>
                                    <TableCell>{i.tipo_origem ? TIPO_ORIGEM[i.tipo_origem] : '—'}</TableCell>
                                    <TableCell>
                                        {i.sem_comprovante_fiscal && <Chip size="small" color="warning" label="Sem comprovante fiscal" sx={{ mr: 0.5 }} />}
                                        {i.especie_a_confirmar && <Chip size="small" color="error" label="Espécie a confirmar" />}
                                    </TableCell>
                                    <TableCell><Button size="small" onClick={() => onOpen(i)}>Abrir</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ))}
            {amostra && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1">Amostra de declarações aprovadas (conferência)</Typography>
                    {amostra.length === 0 ? <Typography color="text.secondary">Nenhuma aprovada ainda.</Typography> : amostra.map((a) => (
                        <Stack key={a.id} direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
                            <Typography variant="body2">{a.produto} · {TIPO_ORIGEM[a.tipo_origem]} · aprovada em {formatarData(a.decidido_em)}</Typography>
                            <Button size="small" onClick={() => onOpen({ tipo: 'DECLARACAO', id: a.id })}>Conferir</Button>
                        </Stack>
                    ))}
                </Box>
            )}
        </Box>
    );
}
