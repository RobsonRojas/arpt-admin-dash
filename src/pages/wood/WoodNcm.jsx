import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../../services/api';
import { BASE, formatarData, formatarNcm, mensagemErro, motivoValido, normalizarNcm, USO_PECA } from '../../utils/wood';

const N = `${BASE}/ncm`;

/** Troca do NCM de um tipo de peça. Pede o motivo (fica na auditoria) e avisa o que a troca atinge. */
export function NcmForm({ item, onSaved, onClose }) {
    const [ncm, setNcm] = useState(item.ncm_formatado ?? item.ncm);
    const [descricao, setDescricao] = useState(item.descricao_pt ?? '');
    const [motivo, setMotivo] = useState('');
    const [erro, setErro] = useState(null);
    const [salvando, setSalvando] = useState(false);

    const salvar = async () => {
        setErro(null);
        const digitos = normalizarNcm(ncm);
        if (!digitos) { setErro('Informe 4, 6 ou 8 dígitos (por exemplo 4420, 4420.90 ou 4420.90.00).'); return; }
        if (!motivoValido(motivo)) { setErro('Informe o motivo (mínimo 3 caracteres): ele fica na auditoria.'); return; }
        const corpo = { ncm: digitos, motivo: motivo.trim() };
        if (descricao.trim() !== (item.descricao_pt ?? '')) corpo.descricao_pt = descricao.trim() || null;
        setSalvando(true);
        try {
            const r = await api.put(`${N}/${item.uso}`, corpo);
            onSaved(r.data);
        } catch (e) { setErro(mensagemErro(e)); } finally { setSalvando(false); }
    };

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>NCM · {USO_PECA[item.uso] ?? item.uso}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {erro && <Alert severity="error">{erro}</Alert>}
                    <Alert severity="warning">
                        Trocar o código atualiza também as declarações que já existem para este tipo de peça, inclusive as aprovadas, e a ficha de exportação
                        que elas geram. Confirme o código com o despachante antes de salvar.
                    </Alert>
                    <TextField label="NCM" value={ncm} onChange={(e) => setNcm(e.target.value)} helperText="4, 6 ou 8 dígitos. Pode usar pontos: 4420.90.00" inputProps={{ inputMode: 'numeric', maxLength: 10 }} />
                    <TextField label="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} inputProps={{ maxLength: 200 }} />
                    <TextField label="Motivo da alteração" multiline minRows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                </Stack>
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Cancelar</Button><Button variant="contained" onClick={salvar} disabled={salvando}>Salvar</Button></DialogActions>
        </Dialog>
    );
}

/** NCM por tipo de peça (add-wood-product-origin-compliance, D8): o administrador corrige sem publicar o sistema de novo. */
export function WoodNcm() {
    const [itens, setItens] = useState([]);
    const [editando, setEditando] = useState(null);
    const [aviso, setAviso] = useState(null);
    const [erro, setErro] = useState(null);

    const carregar = useCallback(async () => {
        setErro(null);
        try { setItens((await api.get(N)).data.itens ?? []); } catch (e) { setErro(mensagemErro(e, 'Não foi possível carregar o NCM.')); }
    }, []);
    useEffect(() => { carregar(); }, [carregar]);

    const salvou = (r) => {
        setEditando(null);
        setAviso(`NCM de ${USO_PECA[r.uso] ?? r.uso} agora é ${r.ncm_formatado}. ${r.declaracoes_atualizadas} declaração(ões) atualizada(s).`);
        carregar();
    };

    return (
        <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
                O produtor nunca digita o NCM: ele sai do tipo de peça escolhido. Os valores iniciais são de partida e precisam ser confirmados por despachante
                antes de a ficha de exportação ser usada em produção.
            </Alert>
            {aviso && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAviso(null)}>{aviso}</Alert>}
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            <Paper variant="outlined">
                <Table size="small">
                    <TableHead><TableRow><TableCell>Tipo de peça</TableCell><TableCell>NCM</TableCell><TableCell>Descrição</TableCell><TableCell>Origem do valor</TableCell><TableCell /></TableRow></TableHead>
                    <TableBody>
                        {itens.map((i) => (
                            <TableRow key={i.uso} data-testid={`ncm-${i.uso}`}>
                                <TableCell>{USO_PECA[i.uso] ?? i.uso}{i.uso === 'BRINQUEDO' && <Typography variant="caption" display="block" color="text.secondary">uso ainda não vendável</Typography>}</TableCell>
                                <TableCell><Typography component="code" sx={{ fontFamily: 'monospace' }}>{i.ncm_formatado ?? formatarNcm(i.ncm)}</Typography></TableCell>
                                <TableCell>{i.descricao_pt ?? '—'}</TableCell>
                                <TableCell>{i.editado ? <Chip size="small" color="primary" label={`Editado em ${formatarData(i.updated_at)}`} /> : <Chip size="small" label="Valor de partida" />}</TableCell>
                                <TableCell align="right"><Button size="small" onClick={() => setEditando(i)}>Editar</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
            {editando && <NcmForm item={editando} onSaved={salvou} onClose={() => setEditando(null)} />}
        </Box>
    );
}
