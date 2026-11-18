import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, LinearProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../../services/api';
import { BASE, mensagemErro } from '../../utils/wood';

const PASSOS = { origem: 'Origem', especie: 'Madeira', local: 'Local', comprovante: 'Comprovante', peca: 'Peça (uso, acabamento, embalagem)', historia: 'História', revisao: 'Revisão e envio' };
const SIMPLIFICACOES = {
    copia: 'Mesma origem de outra peça',
    padrao_perfil: 'Padrões do perfil',
    lote: 'Aplicar a várias peças',
    leitura_documento: 'Leitura do comprovante por IA',
    sugestao_especie: 'Sugestão de madeira por foto',
    voz: 'Ditado por voz',
    lembrete: 'Lembrete de rascunho (aceitaram)',
};
/** Abaixo disso a taxa de abandono é só indício: o plano é ler junto aos testes com 3 a 5 produtores (12.6). */
const AMOSTRA_MINIMA = 30;

/**
 * Funil do formulário de origem (simplificar-processo-produtor, 6.3): por passo, quantas declarações entraram, concluíram e foram abandonadas,
 * e quanto cada simplificação foi usada. Tudo agregado: não há como saber quem desistiu.
 */
export function WoodFunil() {
    const [dias, setDias] = useState(30);
    const [canal, setCanal] = useState('');
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState(null);

    const carregar = useCallback(async () => {
        setErro(null);
        const params = { dias };
        if (canal) params.canal = canal;
        try { setDados((await api.get(`${BASE}/funnel`, { params })).data); } catch (e) { setErro(mensagemErro(e, 'Não foi possível carregar o funil.')); }
    }, [dias, canal]);
    useEffect(() => { carregar(); }, [carregar]);

    const filtros = (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} useFlexGap flexWrap="wrap">
            <TextField select size="small" label="Período" value={dias} onChange={(e) => setDias(Number(e.target.value))} sx={{ minWidth: 160 }} inputProps={{ 'data-testid': 'periodo' }}>
                {[7, 30, 90].map((d) => <MenuItem key={d} value={d}>Últimos {d} dias</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Canal" value={canal} onChange={(e) => setCanal(e.target.value)} sx={{ minWidth: 140 }} inputProps={{ 'data-testid': 'canal' }}>
                <MenuItem value="">Todos</MenuItem><MenuItem value="web">Site</MenuItem><MenuItem value="app">Aplicativo</MenuItem>
            </TextField>
        </Stack>
    );
    if (erro) return <Box>{filtros}<Alert severity="error" action={<Button color="inherit" size="small" onClick={carregar}>Tentar de novo</Button>}>{erro}</Alert></Box>;
    if (!dados) return <Box>{filtros}<Typography role="status">Carregando…</Typography></Box>;

    const entradasTotais = dados.passos.reduce((s, p) => s + p.entradas, 0);
    const maior = Math.max(1, ...dados.passos.map((p) => p.entradas));
    const pior = dados.passos.filter((p) => p.entradas >= AMOSTRA_MINIMA && p.taxa_abandono != null).sort((a, b) => b.taxa_abandono - a.taxa_abandono)[0];

    return (
        <Box>
            {filtros}
            <Alert severity="info" sx={{ mb: 2 }}>
                Números agregados e anônimos de {dados.periodo.de} a {dados.periodo.ate}. Não há como identificar quem desistiu. Com poucos casos, leia junto com os testes com produtores, não isolado.
            </Alert>
            {entradasTotais === 0 && <Typography color="text.secondary" data-testid="sem-dados" sx={{ mb: 2 }}>Ainda não há eventos neste período.</Typography>}
            {pior && <Alert severity="warning" sx={{ mb: 2 }} data-testid="pior-passo">Maior abandono: <b>{PASSOS[pior.passo]}</b>, {pior.taxa_abandono}% de {pior.entradas} entradas.</Alert>}

            <Paper variant="outlined" sx={{ mb: 3, overflowX: 'auto' }}>
                <Table size="small" aria-label="Funil por passo">
                    <TableHead><TableRow>
                        <TableCell>Passo</TableCell><TableCell align="right">Entraram</TableCell><TableCell align="right">Concluíram</TableCell><TableCell align="right">Abandonaram</TableCell><TableCell align="right">Taxa de abandono</TableCell><TableCell sx={{ minWidth: 140 }}>Entradas</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {dados.passos.map((p) => (
                            <TableRow key={p.passo} data-testid={`passo-${p.passo}`}>
                                <TableCell>{PASSOS[p.passo] ?? p.passo}</TableCell>
                                <TableCell align="right">{p.entradas}</TableCell>
                                <TableCell align="right">{p.conclusoes}</TableCell>
                                <TableCell align="right">{p.abandonos}</TableCell>
                                <TableCell align="right" data-testid={`taxa-${p.passo}`}>{p.taxa_abandono == null ? '—' : `${p.taxa_abandono}%`}{p.taxa_abandono != null && p.entradas < AMOSTRA_MINIMA ? ' *' : ''}</TableCell>
                                <TableCell><LinearProgress variant="determinate" value={(p.entradas / maior) * 100} aria-label={`Entradas em ${PASSOS[p.passo] ?? p.passo}`} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: 'block' }}>* menos de {AMOSTRA_MINIMA} entradas: amostra pequena, é só indício.</Typography>
            </Paper>

            <Typography variant="subtitle1" gutterBottom>Uso das simplificações</Typography>
            <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
                <Table size="small" aria-label="Uso das simplificações">
                    <TableHead><TableRow><TableCell>Simplificação</TableCell><TableCell align="right">Usos</TableCell></TableRow></TableHead>
                    <TableBody>
                        {dados.simplificacoes.map((s) => (
                            <TableRow key={s.simplificacao} data-testid={`uso-${s.simplificacao}`}>
                                <TableCell>{SIMPLIFICACOES[s.simplificacao] ?? s.simplificacao}</TableCell><TableCell align="right">{s.usos}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}
