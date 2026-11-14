import { Children, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Accordion, AccordionDetails, AccordionSummary, Alert, Box, Chip, CircularProgress, Divider, InputAdornment, Link, List, ListItemButton, ListItemText, Paper, Stack, TextField, Typography,
} from '@mui/material';
import { ExpandMore, Search } from '@mui/icons-material';
import { buscar, carregarManual, carregarPendencias, indice, resumo, slug, tituloDaSecao } from '../manual/dados';

const ID_EXPLICITO = /\s*\{#([\w-]+)\}\s*$/;
const textoDe = (children) => Children.toArray(children).map((c) => (typeof c === 'string' ? c : '')).join('');

/** Título com âncora: usa o `{#id}` do gerador e o remove do texto; sem ele, deriva do próprio título. */
const Titulo = (nivel) => function Heading({ children }) {
    const filhos = Children.toArray(children);
    const ultimo = filhos[filhos.length - 1];
    const m = typeof ultimo === 'string' ? ID_EXPLICITO.exec(ultimo) : null;
    const limpos = m ? [...filhos.slice(0, -1), ultimo.replace(ID_EXPLICITO, '')] : filhos;
    const id = m ? m[1] : slug(textoDe(filhos));
    const tamanho = { 2: 'h5', 3: 'h6', 4: 'subtitle1', 5: 'subtitle2', 6: 'subtitle2' }[nivel];
    return <Typography id={id} variant={tamanho} component={`h${nivel}`} sx={{ mt: nivel <= 3 ? 3 : 2, mb: 1, fontWeight: 600, scrollMarginTop: 80 }}>{limpos}</Typography>;
};

const Ancora = ({ href, children }) => {
    if (href?.startsWith('/manual')) return <Link component={RouterLink} to={href}>{children}</Link>;
    if (href?.startsWith('#')) return <Link href={href}>{children}</Link>;
    return <Link href={href} target="_blank" rel="noopener noreferrer">{children}</Link>;
};

/** Markdown do manual: sem HTML cru, links externos com `rel`, tabelas e código legíveis. */
export const Markdown = ({ texto }) => (
    <Box sx={{ '& table': { borderCollapse: 'collapse', display: 'block', overflowX: 'auto' }, '& th, & td': { border: '1px solid', borderColor: 'divider', p: 0.75, textAlign: 'left' }, '& pre': { bgcolor: 'grey.100', p: 1.5, overflowX: 'auto', borderRadius: 1, fontSize: 13 }, '& code': { fontFamily: 'monospace', fontSize: '0.9em' }, '& p, & li': { lineHeight: 1.6 } }}>
        <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} components={{ h2: Titulo(2), h3: Titulo(3), h4: Titulo(4), h5: Titulo(5), h6: Titulo(6), a: Ancora }}>{texto}</ReactMarkdown>
    </Box>
);

const Item = ({ i }) => (
    <Paper variant="outlined" sx={{ p: 1.5 }} data-testid="pendencia">
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mb: 0.5 }}>
            <Chip size="small" label={`${i.origem}${i.tarefa ? ` ${i.tarefa}` : ''}`} variant="outlined" />
            {i.bloqueia && <Chip size="small" color="warning" label="Depende de decisão ou terceiro" />}
        </Stack>
        <Typography variant="body2">{i.descricao}</Typography>
        {i.roteiro && <Typography variant="body2" sx={{ mt: 0.5 }}>Roteiro: <Link component={RouterLink} to={`/manual/${i.roteiro.secao}#${i.roteiro.ancora}`}>{i.roteiro.titulo}</Link></Typography>}
    </Paper>
);

/** Todas as tarefas abertas das changes ativas: ações manuais e tarefas de código, por área. */
export const Pendencias = () => {
    const [dados, setDados] = useState(null);
    useEffect(() => { carregarPendencias().then(setDados); }, []);
    if (!dados) return <Box p={3} textAlign="center"><CircularProgress size={28} /></Box>;
    const grupos = (tipo) => {
        const por = new Map();
        for (const i of dados.itens.filter((x) => x.tipo === tipo)) por.set(i.area, [...(por.get(i.area) ?? []), i]);
        return [...por].sort((a, b) => tituloDaSecao(a[0]).localeCompare(tituloDaSecao(b[0])));
    };
    const bloco = (tipo, titulo, descr, aberto) => (
        <Box>
            <Typography variant="h5" sx={{ mt: 2 }}>{titulo} ({tipo === 'manual' ? resumo.manuais : resumo.codigo})</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{descr}</Typography>
            {grupos(tipo).map(([area, lista]) => (
                <Accordion key={area} defaultExpanded={aberto} disableGutters variant="outlined" data-testid={`grupo-${tipo}-${area}`}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography fontWeight={600}>{tituloDaSecao(area)}</Typography>
                        <Chip size="small" sx={{ ml: 1 }} color={tipo === 'manual' ? 'warning' : 'default'} label={lista.length} />
                    </AccordionSummary>
                    <AccordionDetails><Stack spacing={1}>{lista.map((i) => <Item key={i.id} i={i} />)}</Stack></AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
    return (
        <Box>
            <Alert severity={resumo.manuais ? 'warning' : 'info'} data-testid="resumo-pendencias">
                {resumo.total} pendência(s) aberta(s): {resumo.manuais} ação(ões) manual(is) e {resumo.codigo} tarefa(s) de código. Gerado das tarefas abertas das changes ativas; ao concluir a tarefa e regenerar o manual, o item some.
            </Alert>
            {bloco('manual', 'Ações manuais', 'Dependem de uma pessoa: deploy, produção, console de terceiros (Google Cloud, Keycloak, Stripe…), decisão de produto ou parecer.', true)}
            {bloco('codigo', 'Tarefas de código abertas', 'Trabalho de desenvolvimento ainda não concluído nas changes ativas.', false)}
        </Box>
    );
};

const Indice = () => {
    const navigate = useNavigate();
    const [termo, setTermo] = useState('');
    const [manual, setManual] = useState(null);
    useEffect(() => { if (termo.trim().length >= 2 && !manual) carregarManual().then(setManual); }, [termo, manual]);
    const achados = useMemo(() => (manual ? buscar(manual, termo) : []), [manual, termo]);
    const grupos = [...new Set(indice.secoes.map((s) => s.grupo))];
    return (
        <Box sx={{ display: 'grid', gap: 2 }}>
            <Typography variant="h4">Manual do ecossistema ARPT</Typography>
            <Typography color="text.secondary">Como cada área funciona, o que está implementado, os tutoriais de operação e tudo que ainda está pendente.</Typography>
            <TextField size="small" fullWidth placeholder="Buscar no manual (ex.: domínio próprio)" value={termo} onChange={(e) => setTermo(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} inputProps={{ 'aria-label': 'Buscar no manual' }} />
            {termo.trim().length >= 2 && (
                <Paper variant="outlined" data-testid="resultados">
                    {!manual ? <Box p={2}><CircularProgress size={20} /></Box> : achados.length === 0 ? <Typography p={2}>Nada encontrado para “{termo}”.</Typography> : (
                        <List dense>{achados.map((a) => (
                            <ListItemButton key={a.id} onClick={() => navigate(`/manual/${a.id}`)}>
                                <ListItemText primary={`${a.titulo} (${a.ocorrencias})`} secondary={a.trecho} />
                            </ListItemButton>
                        ))}</List>
                    )}
                </Paper>
            )}
            {grupos.map((g) => (
                <Box key={g}>
                    <Typography variant="h6" sx={{ mb: 1 }}>{g}</Typography>
                    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                        {indice.secoes.filter((s) => s.grupo === g).map((s) => {
                            const n = s.id === 'pendencias' ? resumo.total : resumo.porArea[s.id]?.total ?? 0;
                            return (
                                <Paper key={s.id} variant="outlined" sx={{ p: 1.5, cursor: 'pointer' }} component={RouterLink} to={`/manual/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={600}>{s.titulo}</Typography>{n > 0 && <Chip size="small" color="warning" label={`${n} pendência(s)`} />}</Stack>
                                    <Typography variant="body2" color="text.secondary">{s.resumo}</Typography>
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

const Secao = ({ id }) => {
    const { hash } = useLocation();
    const [manual, setManual] = useState(null);
    useEffect(() => { carregarManual().then(setManual); }, []);
    const meta = indice.secoes.find((s) => s.id === id);
    const secao = manual?.secoes.find((s) => s.id === id);
    useEffect(() => {
        if (!hash) return;
        const t = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView?.({ block: 'start' }), 50);
        return () => clearTimeout(t);
    }, [hash, secao]);
    if (!meta) return (
        <Alert severity="warning" action={<Link component={RouterLink} to="/manual">Voltar ao índice</Link>}>Seção “{id}” não encontrada no manual.</Alert>
    );
    const sumario = secao ? [...secao.markdown.matchAll(/^## (.+?) \{#([\w-]+)\}\s*$/gm)].map((m) => ({ titulo: m[1], id: m[2] })) : [];
    return (
        <Box sx={{ display: 'grid', gap: 2 }}>
            <Link component={RouterLink} to="/manual" underline="hover">← Manual</Link>
            <Typography variant="h4" component="h1">{meta.titulo}</Typography>
            {meta.rotas.length > 0 && <Typography variant="body2" color="text.secondary">Área do painel: {meta.rotas.join(', ')}</Typography>}
            {id === 'pendencias' ? <><Typography>{meta.resumo}</Typography><Pendencias /></> : !secao ? <CircularProgress size={28} /> : (
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                    <Box sx={{ minWidth: 0, flex: 1 }} data-testid="conteudo-secao">
                        {resumo.porArea[id]?.total > 0 && (
                            <Alert severity="warning" sx={{ mb: 2 }} action={<Link component={RouterLink} to="/manual/pendencias">Ver</Link>}>{resumo.porArea[id].total} pendência(s) nesta área ({resumo.porArea[id].manuais} ação(ões) manual(is)).</Alert>
                        )}
                        <Markdown texto={secao.markdown} />
                        {secao.specs.length > 0 && (<><Divider sx={{ my: 2 }} /><Typography variant="caption" color="text.secondary">Specs de origem: {secao.specs.join(', ')}</Typography></>)}
                    </Box>
                    {sumario.length > 0 && (
                        <Paper variant="outlined" sx={{ display: { xs: 'none', lg: 'block' }, width: 240, p: 1.5, position: 'sticky', top: 80 }} component="nav" aria-label="Nesta seção">
                            <Typography variant="subtitle2" gutterBottom>Nesta seção</Typography>
                            {sumario.map((t) => <Link key={t.id} href={`#${t.id}`} display="block" variant="body2" sx={{ mb: 0.5 }}>{t.titulo}</Link>)}
                        </Paper>
                    )}
                </Box>
            )}
        </Box>
    );
};

/** Manual geral do ecossistema ARPT (change add-admin-ecosystem-manual). `/manual` = índice e busca; `/manual/:secao` = seção. */
export const Manual = () => {
    const { secao } = useParams();
    return <Box sx={{ p: { xs: 1, md: 3 } }}>{secao ? <Secao id={secao} /> : <Indice />}</Box>;
};
