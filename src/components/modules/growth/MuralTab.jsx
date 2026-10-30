import { useCallback, useEffect, useState } from 'react';
import {
    Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { api } from '../../../services/api';
import { dataBr, escolhasDoMural, mensagemErro } from '../../../utils/growthAdmin';

/** Moderação do mural de apoiadores: quem escolheu aparecer (nome ou logo). Sem valor, e-mail nem CPF. */
export const MuralTab = ({ projectId }) => {
    const [lista, setLista] = useState(null);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');
    const [remover, setRemover] = useState(null);

    const carregar = useCallback(async () => {
        try {
            const r = await api.get(`/admin/reconhecimento/projeto/${projectId}`);
            setLista(escolhasDoMural(r.data?.reconhecimentos));
        } catch (err) {
            setErro(mensagemErro(err, 'Não foi possível carregar o mural.'));
        }
    }, [projectId]);

    useEffect(() => { carregar(); }, [carregar]);

    const confirmarRemocao = async () => {
        const alvo = remover;
        setRemover(null); setErro(''); setAviso('');
        try {
            await api.delete(`/admin/reconhecimento/${alvo.patrocinio}`);
            setAviso('Removido do mural. O apoiador pode escolher de novo pelo painel dele.');
            await carregar();
        } catch (err) {
            setErro(mensagemErro(err, 'Não foi possível remover do mural.'));
        }
    };

    return (
        <Box>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            {aviso && <Alert severity="success" sx={{ mb: 2 }}>{aviso}</Alert>}
            {!lista ? (!erro && <Box p={3} textAlign="center"><CircularProgress size={28} /></Box>) : lista.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nenhum apoiador escolheu aparecer no mural deste negócio.</Typography>
            ) : (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Apoio</TableCell>
                            <TableCell>Exibido como</TableCell>
                            <TableCell>Escolhido em</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {lista.map((r) => (
                            <TableRow key={r.patrocinio}>
                                <TableCell>#{r.patrocinio}</TableCell>
                                <TableCell>
                                    {r.modo === 'NOME' ? r.nome_exibicao : (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <img src={r.logo_url} alt="Logo exibida no mural" style={{ maxHeight: 32, maxWidth: 96 }} referrerPolicy="no-referrer" />
                                            <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>{r.logo_url}</Typography>
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell>{dataBr(r.atualizado_em)}</TableCell>
                                <TableCell align="right">
                                    <Button size="small" color="error" onClick={() => setRemover(r)}>Remover</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <Dialog open={!!remover} onClose={() => setRemover(null)}>
                <DialogTitle>Remover do mural?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        O apoio #{remover?.patrocinio} deixa de aparecer no mural público na próxima carga da página. O apoio em si não muda, e o apoiador pode escolher de novo.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRemover(null)}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={confirmarRemocao}>Remover</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
