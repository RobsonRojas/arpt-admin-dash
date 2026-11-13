import { useState } from 'react';
import {
    Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl,
    InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography,
} from '@mui/material';
import { api } from '../services/api';

const BASE = '/admin/store-customers';
const msg = (err, padrao) => err?.response?.data?.error || err?.response?.data?.message || padrao;

/**
 * Clientes de loja (fix-store-modal-shape-and-add-customer-verification-admin): busca EXATA por e-mail, estado da conta e duas ações —
 * reenviar o e-mail de verificação e marcar o e-mail como verificado. Sem listagem em massa; cada ação é auditada no servidor.
 */
export const StoreCustomers = () => {
    const [email, setEmail] = useState('');
    const [dados, setDados] = useState(null);
    const [buscado, setBuscado] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [aviso, setAviso] = useState(null);
    const [slug, setSlug] = useState('');
    const [confirmando, setConfirmando] = useState(false);
    const [motivo, setMotivo] = useState('');

    const buscar = async (e) => {
        e?.preventDefault();
        const alvo = email.trim().toLowerCase();
        if (!alvo) return;
        setCarregando(true); setAviso(null); setDados(null);
        try {
            const r = await api.get(BASE, { params: { email: alvo } });
            setDados(r.data); setBuscado(alvo);
            setSlug(r.data.lojas_vinculadas?.[0]?.slug ?? r.data.lojas_disponiveis?.[0]?.slug ?? '');
        } catch (err) { setAviso({ tipo: 'error', texto: msg(err, 'Não foi possível consultar.') }); }
        finally { setCarregando(false); }
    };

    const agir = async (rota, corpo, sucesso) => {
        setCarregando(true); setAviso(null);
        try {
            await api.post(`${BASE}/${rota}`, corpo);
            setAviso({ tipo: 'success', texto: sucesso });
            const r = await api.get(BASE, { params: { email: buscado } });
            setDados(r.data);
        } catch (err) { setAviso({ tipo: 'error', texto: msg(err, 'Não foi possível concluir a ação.') }); }
        finally { setCarregando(false); setConfirmando(false); setMotivo(''); }
    };

    const lojas = dados?.lojas_disponiveis ?? [];
    return (
        <Box p={3} maxWidth={720}>
            <Typography variant="h5" gutterBottom>Clientes de loja</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Busque pelo e-mail exato. Use para reenviar a verificação de quem não recebeu a mensagem ou para confirmar o e-mail manualmente. Cada ação fica registrada na auditoria.
            </Typography>
            <Box component="form" onSubmit={buscar} display="flex" gap={1} mb={2}>
                <TextField size="small" fullWidth type="email" label="E-mail do cliente" value={email} onChange={(e) => setEmail(e.target.value)} inputProps={{ maxLength: 160 }} />
                <Button type="submit" variant="contained" disabled={carregando || !email.trim()}>Buscar</Button>
            </Box>
            {carregando && <CircularProgress size={22} />}
            {aviso && <Alert severity={aviso.tipo} sx={{ mb: 2 }}>{aviso.texto}</Alert>}
            {dados && !dados.existe && <Alert severity="info">Não há conta com o e-mail {buscado}.</Alert>}
            {dados?.existe && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>{buscado}</Typography>
                    <Stack direction="row" gap={1} flexWrap="wrap" mb={2}>
                        <Chip size="small" color={dados.email_verificado ? 'success' : 'warning'} label={dados.email_verificado ? 'E-mail verificado' : 'E-mail não verificado'} />
                        <Chip size="small" color={dados.ativo ? 'default' : 'error'} label={dados.ativo ? 'Conta ativa' : 'Conta desativada'} />
                    </Stack>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Lojas com vínculo: {dados.lojas_vinculadas.length ? dados.lojas_vinculadas.map((l) => l.nome).join(', ') : 'nenhuma (ainda não entrou em nenhuma loja)'}
                    </Typography>
                    {!dados.email_verificado && (
                        <Stack gap={2}>
                            <FormControl size="small" fullWidth>
                                <InputLabel id="loja-reenvio">Loja de onde o link será enviado</InputLabel>
                                <Select labelId="loja-reenvio" label="Loja de onde o link será enviado" value={slug} onChange={(e) => setSlug(e.target.value)}>
                                    {lojas.map((l) => <MenuItem key={l.id} value={l.slug}>{l.nome} ({l.slug})</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Stack direction="row" gap={1} flexWrap="wrap">
                                <Button variant="outlined" disabled={carregando || !slug || !dados.ativo}
                                    onClick={() => agir('resend-verification', { email: buscado, slug }, 'E-mail de verificação enviado.')}>
                                    Reenviar e-mail de verificação
                                </Button>
                                <Button variant="outlined" color="warning" disabled={carregando || !dados.ativo} onClick={() => setConfirmando(true)}>
                                    Marcar como verificado
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                </Paper>
            )}
            <Dialog open={confirmando} onClose={() => setConfirmando(false)}>
                <DialogTitle>Marcar e-mail como verificado?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        O cliente {buscado} poderá entrar nas lojas sem confirmar o e-mail. Use só quando tiver certeza de que o e-mail é dele. A ação fica na auditoria.
                    </DialogContentText>
                    <TextField size="small" fullWidth label="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} inputProps={{ maxLength: 200 }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmando(false)}>Cancelar</Button>
                    <Button color="warning" variant="contained" disabled={carregando}
                        onClick={() => agir('verify-email', { email: buscado, confirm: true, ...(motivo.trim() ? { motivo: motivo.trim() } : {}) }, 'E-mail marcado como verificado.')}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
