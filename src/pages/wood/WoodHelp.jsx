import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { api } from '../../services/api';
import { BASE, formatarData, mensagemErro, normalizarWhatsapp } from '../../utils/wood';

const H = `${BASE}/help`;
const dia = (v) => (v ? String(v).slice(0, 10) : '');

/** Campos de cada tipo de conteúdo (nome, rótulo, multilinha). */
const TIPOS = {
    glossary: { rotulo: 'Glossário', rota: 'glossary', chave: 'chave', titulo: (i) => i.termo_pt, campos: [['chave', 'Chave (a-z, 0-9, _)'], ['termo_pt', 'Termo (pt)'], ['termo_en', 'Termo (en)'], ['texto_pt', 'Texto (pt)', 1], ['texto_en', 'Texto (en)', 1]], remover: true },
    steps: { rotulo: 'Textos por passo', rota: 'steps', chave: 'chave', titulo: (i) => `${i.chave} · ${i.titulo_pt}`, campos: [['chave', 'Chave do passo'], ['titulo_pt', 'Título (pt)'], ['titulo_en', 'Título (en)'], ['texto_pt', 'Texto (pt)', 1], ['texto_en', 'Texto (en)', 1], ['exemplo_pt', 'Exemplo (pt)', 1], ['exemplo_en', 'Exemplo (en)', 1], ['foto_url', 'Foto (URL)']] },
    guide: { rotulo: 'Guia de orientação', rota: 'guide', chave: 'id', titulo: (i) => i.situacao_pt, campos: [['situacao_chave', 'Chave da situação'], ['situacao_pt', 'Situação (pt)'], ['situacao_en', 'Situação (en)'], ['quem_pt', 'Quem (pt)'], ['quem_en', 'Quem (en)'], ['o_que_faz_pt', 'O que faz (pt)', 1], ['o_que_faz_en', 'O que faz (en)', 1], ['como_chegar_pt', 'Como chegar (pt)', 1], ['como_chegar_en', 'Como chegar (en)', 1], ['contato_publico', 'Contato público']], remover: true },
};

export function HelpItemForm({ tipo, inicial, onSaved, onClose }) {
    const cfg = TIPOS[tipo];
    const [f, setF] = useState({ ...inicial, revisado_em: dia(inicial?.revisado_em) || new Date().toISOString().slice(0, 10) });
    const [erro, setErro] = useState(null);
    const salvar = async () => {
        setErro(null);
        const corpo = {};
        for (const [k] of cfg.campos) if (f[k] !== undefined && f[k] !== '') corpo[k] = f[k]; else if (inicial?.id && f[k] === '') corpo[k] = null;
        corpo.revisado_em = f.revisado_em || null;
        try {
            if (tipo === 'guide') { if (inicial?.id) await api.put(`${H}/guide/${inicial.id}`, corpo); else await api.post(`${H}/guide`, corpo); }
            else await api.put(`${H}/${cfg.rota}`, corpo);
            onSaved();
        } catch (e) { setErro(mensagemErro(e)); }
    };
    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{inicial?.id ? 'Editar' : 'Novo'} · {cfg.rotulo}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {erro && <Alert severity="error">{erro}</Alert>}
                    {cfg.campos.map(([k, r, multi]) => (
                        <TextField key={k} label={r} multiline={!!multi} minRows={multi ? 2 : 1} value={f[k] ?? ''} disabled={k === cfg.chave && !!inicial?.id && tipo !== 'guide'} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} />
                    ))}
                    <TextField label="Data da revisão" type="date" InputLabelProps={{ shrink: true }} value={f.revisado_em ?? ''} onChange={(e) => setF((x) => ({ ...x, revisado_em: e.target.value }))} />
                </Stack>
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Cancelar</Button><Button variant="contained" onClick={salvar}>Salvar</Button></DialogActions>
        </Dialog>
    );
}

function Conteudo({ tipo }) {
    const cfg = TIPOS[tipo];
    const [itens, setItens] = useState([]);
    const [vencidos, setVencidos] = useState([]);
    const [erro, setErro] = useState(null);
    const [editando, setEditando] = useState(null);
    const carregar = useCallback(async () => {
        try {
            setItens((await api.get(`${H}/${cfg.rota}`)).data.itens);
            if (tipo === 'guide') setVencidos((await api.get(`${H}/guide/review`)).data.itens);
        } catch (e) { setErro(mensagemErro(e, 'Não foi possível carregar o conteúdo.')); }
    }, [cfg.rota, tipo]);
    useEffect(() => { carregar(); }, [carregar]);
    const remover = async (i) => { try { await api.delete(`${H}/${cfg.rota}/${i.id}`); carregar(); } catch (e) { setErro(mensagemErro(e)); } };
    return (
        <Box>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            {tipo === 'guide' && vencidos.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <b>Para revisar ({vencidos.length}):</b> {vencidos.map((v) => `${v.situacao_pt} (${v.revisado_em ? `revisado em ${dia(v.revisado_em)}` : 'nunca revisado'})`).join('; ')}
                </Alert>
            )}
            <Button variant="contained" sx={{ mb: 2 }} onClick={() => setEditando({})}>Novo item</Button>
            {itens.map((i) => (
                <Paper key={i.id} sx={{ p: 1.5, mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ flex: 1 }}>{cfg.titulo(i)}</Typography>
                        {i.ativo === false && <Chip size="small" label="inativo" />}
                        {i.confirmar_antes_de_ir && <Chip size="small" color="warning" label="revisão vencida" />}
                        <Typography variant="caption">revisado: {dia(i.revisado_em) || 'nunca'}</Typography>
                        <Button size="small" onClick={() => setEditando(i)}>Editar</Button>
                        {cfg.remover && i.ativo !== false && <Button size="small" color="error" onClick={() => remover(i)}>Desativar</Button>}
                    </Stack>
                </Paper>
            ))}
            {editando && <HelpItemForm tipo={tipo} inicial={editando.id || editando.chave ? editando : undefined} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); carregar(); }} />}
        </Box>
    );
}

export function SupportContact() {
    const [valor, setValor] = useState('');
    const [aviso, setAviso] = useState(null);
    useEffect(() => { api.get(`${H}/support-contact`).then((r) => setValor(r.data.whatsapp ?? '')).catch((e) => setAviso({ tipo: 'error', texto: mensagemErro(e) })); }, []);
    const salvar = async () => {
        setAviso(null);
        if (!normalizarWhatsapp(valor)) return setAviso({ tipo: 'error', texto: 'Informe um número de WhatsApp válido, com DDD.' });
        try { const r = await api.put(`${H}/support-contact`, { whatsapp: valor }); setValor(r.data.whatsapp); setAviso({ tipo: 'success', texto: 'Número de WhatsApp atualizado.' }); }
        catch (e) { setAviso({ tipo: 'error', texto: mensagemErro(e) }); }
    };
    return (
        <Paper sx={{ p: 2, maxWidth: 520 }}>
            <Typography variant="subtitle1">WhatsApp de apoio ao produtor</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Vale para o botão "Falar com a ARPT" e para as mensagens de apoio.</Typography>
            {aviso && <Alert severity={aviso.tipo} sx={{ mb: 1 }}>{aviso.texto}</Alert>}
            <Stack direction="row" spacing={1}>
                <TextField size="small" fullWidth label="Número de WhatsApp (com DDD)" value={valor} onChange={(e) => setValor(e.target.value)} />
                <Button variant="contained" onClick={salvar}>Salvar</Button>
            </Stack>
        </Paper>
    );
}

function Conversas() {
    const [itens, setItens] = useState(null);
    const [erro, setErro] = useState(null);
    useEffect(() => { api.get(`${H}/advisor/conversations`, { params: { limite: 50 } }).then((r) => setItens(r.data.itens)).catch((e) => setErro(mensagemErro(e))); }, []);
    return (
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Conversas recentes do consultor de IA, para revisão por amostra.</Typography>
            {erro && <Alert severity="error">{erro}</Alert>}
            {itens && itens.length === 0 && <Typography color="text.secondary">Nenhuma conversa.</Typography>}
            {(itens ?? []).map((c) => (
                <Paper key={c.id} sx={{ p: 1.5, mb: 1 }}>
                    <Typography variant="caption">{formatarData(c.created_at)} · passo {c.passo ?? '—'} · {c.status}</Typography>
                    <Typography variant="body2"><b>Pergunta:</b> {c.pergunta}</Typography>
                    <Typography variant="body2"><b>Resposta:</b> {c.resposta}</Typography>
                </Paper>
            ))}
        </Box>
    );
}

/** Conteúdo de ajuda, WhatsApp de apoio e revisão das conversas do consultor. */
export function WoodHelp() {
    const [aba, setAba] = useState(0);
    return (
        <Box>
            <Tabs value={aba} onChange={(_, v) => setAba(v)} sx={{ mb: 2 }} variant="scrollable">
                <Tab label="Glossário" /><Tab label="Textos por passo" /><Tab label="Guia" /><Tab label="WhatsApp" /><Tab label="Conversas do consultor" />
            </Tabs>
            {aba === 0 && <Conteudo tipo="glossary" />}
            {aba === 1 && <Conteudo tipo="steps" />}
            {aba === 2 && <Conteudo tipo="guide" />}
            {aba === 3 && <SupportContact />}
            {aba === 4 && <Conversas />}
        </Box>
    );
}
