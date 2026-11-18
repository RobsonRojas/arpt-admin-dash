import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, FormControlLabel, MenuItem, Paper, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../../services/api';
import { BASE, formatarData, mensagemErro } from '../../utils/wood';

const MODO = {
    off: { texto: 'Desligado: só coleta', cor: 'default' },
    warn: { texto: 'Aviso: mede, não bloqueia', cor: 'warning' },
    block: { texto: 'Bloqueio ligado', cor: 'error' },
};

const Numero = ({ rotulo, valor, destaque }) => (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 170, flex: '1 1 170px' }} data-testid={`num-${rotulo}`}>
        <Typography variant="h5" color={destaque ? 'error' : 'text.primary'}>{valor ?? '—'}</Typography>
        <Typography variant="body2" color="text.secondary">{rotulo}</Typography>
    </Paper>
);

/**
 * Adequação da origem da madeira (add-wood-product-origin-compliance, 12.3): quantos produtos de madeira ficariam fora de venda se o
 * bloqueio estivesse ligado agora, e por quê. Serve para operar em modo de aviso, ajustar regras e avisar os produtores antes do bloqueio.
 */
export function WoodAdequacao() {
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState(null);
    const [causa, setCausa] = useState('');
    const [soPublicados, setSoPublicados] = useState(false);

    const carregar = useCallback(async () => {
        setErro(null);
        const params = { limite: 200 };
        if (causa) params.causa = causa;
        if (soPublicados) params.publicados = true;
        try { setDados((await api.get(`${BASE}/adequacao`, { params })).data); } catch (e) { setErro(mensagemErro(e, 'Não foi possível carregar o relatório.')); }
    }, [causa, soPublicados]);
    useEffect(() => { carregar(); }, [carregar]);

    if (erro) return <Alert severity="error" action={<Button color="inherit" size="small" onClick={carregar}>Tentar de novo</Button>}>{erro}</Alert>;
    if (!dados) return <Typography role="status">Carregando…</Typography>;
    const { configuracao: c, resumo: r } = dados;
    const modo = MODO[c.modo] ?? MODO.off;
    const explicacao = Object.fromEntries(dados.por_causa.map((x) => [x.causa, x.explicacao]));

    return (
        <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} useFlexGap flexWrap="wrap">
                <Chip color={modo.cor} label={modo.texto} data-testid="modo" />
                <Typography variant="body2" color="text.secondary">
                    Prazo de adequação: {c.dias_de_adequacao} dias{c.bloqueio_desde ? ` (bloqueio desde ${c.bloqueio_desde})` : ' (conta a partir da data em que o bloqueio for ligado)'}.
                </Typography>
            </Stack>
            <Alert severity="info" sx={{ mb: 2 }}>
                Mostra o que sairia de venda se o bloqueio estivesse ligado <b>agora</b>, sem considerar o prazo de adequação. Use para ajustar as regras e a lista de
                espécies e para avisar os produtores antes de ligar. Gerado em {formatarData(dados.gerado_em)}.
            </Alert>

            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
                <Numero rotulo="Produtos de madeira" valor={r.produtos_de_madeira} />
                <Numero rotulo="Com origem aprovada" valor={r.com_origem_aprovada} />
                <Numero rotulo="Ficariam fora de venda" valor={r.ficariam_fora_de_venda} destaque={r.ficariam_fora_de_venda > 0} />
                <Numero rotulo="Já publicados" valor={r.dos_quais_publicados} destaque={r.dos_quais_publicados > 0} />
                <Numero rotulo="Alocações em lojas" valor={r.alocacoes_ativas_afetadas} />
                <Numero rotulo="Produtores afetados" valor={r.produtores_afetados} />
                <Numero rotulo="Adequado" valor={r.percentual_adequado === null ? null : `${r.percentual_adequado}%`} />
            </Stack>

            <Typography variant="h6" gutterBottom>Por causa</Typography>
            <Paper variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                    <TableHead><TableRow><TableCell>Causa</TableCell><TableCell align="right">Produtos</TableCell><TableCell>O que significa</TableCell></TableRow></TableHead>
                    <TableBody>
                        {dados.por_causa.filter((x) => x.causa !== 'APROVADA_VALIDA').map((x) => (
                            <TableRow key={x.causa} hover selected={causa === x.causa} data-testid={`causa-${x.causa}`} onClick={() => setCausa(causa === x.causa ? '' : x.causa)} sx={{ cursor: 'pointer' }}>
                                <TableCell>{x.causa}</TableCell>
                                <TableCell align="right">{x.total}</TableCell>
                                <TableCell>{x.explicacao}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            <Typography variant="h6" gutterBottom>Produtores com mais produtos publicados afetados</Typography>
            <Paper variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                    <TableHead><TableRow><TableCell>Produtor</TableCell><TableCell align="right">Produtos</TableCell><TableCell align="right">Publicados</TableCell><TableCell align="right">Lojas</TableCell></TableRow></TableHead>
                    <TableBody>
                        {dados.por_produtor.length === 0 && <TableRow><TableCell colSpan={4}>Nenhum produtor afetado.</TableCell></TableRow>}
                        {dados.por_produtor.map((p) => (
                            <TableRow key={p.produtor}><TableCell>{p.nome}</TableCell><TableCell align="right">{p.produtos}</TableCell><TableCell align="right">{p.publicados}</TableCell><TableCell align="right">{p.lojas_afetadas}</TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }} useFlexGap flexWrap="wrap">
                <Typography variant="h6">Produtos</Typography>
                <TextField select size="small" label="Causa" value={causa} onChange={(e) => setCausa(e.target.value)} sx={{ minWidth: 240 }}>
                    <MenuItem value="">Todas</MenuItem>
                    {dados.por_causa.filter((x) => x.causa !== 'APROVADA_VALIDA').map((x) => <MenuItem key={x.causa} value={x.causa}>{x.causa}</MenuItem>)}
                </TextField>
                <FormControlLabel control={<Switch checked={soPublicados} onChange={(e) => setSoPublicados(e.target.checked)} />} label="Só os já publicados" />
            </Stack>
            <Paper variant="outlined">
                <Table size="small">
                    <TableHead><TableRow><TableCell>Produto</TableCell><TableCell>Produtor</TableCell><TableCell>Causa</TableCell><TableCell>Publicado</TableCell><TableCell align="right">Lojas</TableCell></TableRow></TableHead>
                    <TableBody>
                        {dados.itens.length === 0 && <TableRow><TableCell colSpan={5}>Nenhum produto neste filtro.</TableCell></TableRow>}
                        {dados.itens.map((i) => (
                            <TableRow key={i.produto_id} data-testid={`item-${i.produto_id}`}>
                                <TableCell>{i.nome} <Typography component="span" variant="caption" color="text.secondary">#{i.produto_id}</Typography></TableCell>
                                <TableCell>{i.produtor_nome ?? '—'}</TableCell>
                                <TableCell title={explicacao[i.causa]}>{i.causa}</TableCell>
                                <TableCell>{i.publicado ? <Chip size="small" color="warning" label="sim" /> : 'não'}</TableCell>
                                <TableCell align="right">{i.lojas_ativas}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {dados.itens_total > dados.itens.length && <Typography variant="caption" sx={{ p: 1, display: 'block' }}>Mostrando {dados.itens.length} de {dados.itens_total}. Use os filtros para ver os demais.</Typography>}
            </Paper>
        </Box>
    );
}
