import { useCallback, useEffect, useState } from 'react';
import {
    Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid,
    Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { api } from '../../../services/api';
import { avisoRevogacao, corpoCertificacao, dataBr, errosCertificacao, mensagemErro } from '../../../utils/growthAdmin';

const VAZIO = { padrao: '', registro_numero: '', entidade: '', quantidade_tco2e: '', vigencia_inicio: '', vigencia_fim: '' };

/** Certificação de carbono do negócio. Sem ela, o relatório de impacto não mostra carbono. Revogar despublica os relatórios que dependiam dela. */
export const CertificacoesTab = ({ projectId }) => {
    const [lista, setLista] = useState(null);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');
    const [form, setForm] = useState(VAZIO);
    const [erros, setErros] = useState({});
    const [salvando, setSalvando] = useState(false);
    const [revogar, setRevogar] = useState(null);

    const carregar = useCallback(async () => {
        try {
            const r = await api.get(`/admin/projetos/${projectId}/certificacoes-carbono`);
            setLista(r.data?.certificacoes ?? []);
        } catch (err) {
            setErro(mensagemErro(err, 'Não foi possível carregar as certificações.'));
        }
    }, [projectId]);

    useEffect(() => { carregar(); }, [carregar]);

    const campo = (nome) => ({
        name: nome,
        value: form[nome],
        onChange: (e) => setForm((f) => ({ ...f, [nome]: e.target.value })),
        error: !!erros[nome],
        helperText: erros[nome] || ' ',
        size: 'small',
        fullWidth: true,
    });

    const registrar = async (e) => {
        e.preventDefault();
        setErro(''); setAviso('');
        const v = errosCertificacao(form);
        setErros(v);
        if (Object.keys(v).length) return;
        setSalvando(true);
        try {
            await api.post(`/admin/projetos/${projectId}/certificacoes-carbono`, corpoCertificacao(form));
            setForm(VAZIO);
            setAviso('Certificação registrada. Vale para relatórios gerados daqui em diante, de períodos dentro da vigência.');
            await carregar();
        } catch (err) {
            setErro(mensagemErro(err, 'Não foi possível registrar a certificação.'));
        } finally {
            setSalvando(false);
        }
    };

    const confirmarRevogacao = async () => {
        const alvo = revogar;
        setRevogar(null); setErro(''); setAviso('');
        try {
            const r = await api.delete(`/admin/projetos/${projectId}/certificacoes-carbono/${alvo.id}`);
            const n = Number(r.data?.despublicados) || 0;
            setAviso(n ? `Certificação revogada. ${n} relatório(s) despublicado(s).` : 'Certificação revogada.');
            await carregar();
        } catch (err) {
            setErro(mensagemErro(err, 'Não foi possível revogar a certificação.'));
        }
    };

    return (
        <Box>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            {aviso && <Alert severity="success" sx={{ mb: 2 }}>{aviso}</Alert>}

            {!lista ? (!erro && <Box p={3} textAlign="center"><CircularProgress size={28} /></Box>) : lista.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Nenhuma certificação registrada.</Typography>
            ) : (
                <Table size="small" sx={{ mb: 3 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Padrão / registro</TableCell>
                            <TableCell>Entidade</TableCell>
                            <TableCell align="right">tCO₂e</TableCell>
                            <TableCell>Vigência</TableCell>
                            <TableCell>Situação</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {lista.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell>{c.padrao}<Typography variant="caption" display="block" color="text.secondary">{c.registro_numero}</Typography></TableCell>
                                <TableCell>{c.entidade}</TableCell>
                                <TableCell align="right">{Number(c.quantidade_tco2e).toLocaleString('pt-BR')}</TableCell>
                                <TableCell>{dataBr(c.vigencia_inicio)} a {dataBr(c.vigencia_fim)}</TableCell>
                                <TableCell>
                                    {c.revogada_em
                                        ? <Chip size="small" label={`Revogada em ${dataBr(c.revogada_em)}`} />
                                        : <Chip size="small" color="success" label="Válida" />}
                                </TableCell>
                                <TableCell align="right">
                                    {!c.revogada_em && <Button size="small" color="error" onClick={() => setRevogar(c)}>Revogar</Button>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <Typography variant="subtitle2" gutterBottom>Registrar certificação</Typography>
            <Box component="form" onSubmit={registrar} noValidate>
                <Grid container spacing={1}>
                    <Grid item xs={12} sm={4}><TextField label="Padrão" {...campo('padrao')} /></Grid>
                    <Grid item xs={12} sm={4}><TextField label="Número de registro" {...campo('registro_numero')} /></Grid>
                    <Grid item xs={12} sm={4}><TextField label="Entidade emissora" {...campo('entidade')} /></Grid>
                    <Grid item xs={12} sm={4}><TextField label="Quantidade (tCO₂e)" inputProps={{ inputMode: 'decimal' }} {...campo('quantidade_tco2e')} /></Grid>
                    <Grid item xs={6} sm={4}><TextField label="Início da vigência" type="date" InputLabelProps={{ shrink: true }} {...campo('vigencia_inicio')} /></Grid>
                    <Grid item xs={6} sm={4}><TextField label="Fim da vigência" type="date" InputLabelProps={{ shrink: true }} {...campo('vigencia_fim')} /></Grid>
                </Grid>
                <Button type="submit" variant="contained" disabled={salvando}>Registrar</Button>
            </Box>

            <Dialog open={!!revogar} onClose={() => setRevogar(null)}>
                <DialogTitle>Revogar certificação?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom>{revogar?.padrao} · {revogar?.registro_numero}</Typography>
                    <Alert severity={revogar?.relatorios_publicados ? 'warning' : 'info'} data-testid="aviso-revogacao">
                        {avisoRevogacao(revogar?.relatorios_publicados)}
                    </Alert>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        A revogação não se desfaz. Para voltar a valer, registre a certificação de novo.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRevogar(null)}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={confirmarRevogacao}>Revogar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
