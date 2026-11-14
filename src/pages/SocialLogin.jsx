import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, Paper, Stack, Switch, Typography } from '@mui/material';
import { api } from '../services/api';
import { mensagemServidor } from '../utils/monitoring';

const BASE = '/api/v1/admin/social-login';
const GRUPOS = ['Google Cloud', 'Keycloak', 'Plataforma'];
const ESTADOS = {
    ok: { rotulo: 'OK', cor: 'success' },
    falha: { rotulo: 'Falhou', cor: 'error' },
    pendente: { rotulo: 'Pendente', cor: 'warning' },
    inconclusivo: { rotulo: 'Inconclusivo', cor: 'default' },
};
const ALVOS = [
    { id: 'site', titulo: 'arpt.site', descr: 'Botão "Continuar com Google" na entrada, no cadastro e no convite de equipe.' },
    { id: 'lojas', titulo: 'Lojas de dropshippers', descr: 'Botão "Continuar com Google" nos modais Entrar e Criar conta de toda loja.' },
];

/** Login social (add-google-social-login-via-keycloak): interruptores do arpt.site e das lojas, com verificação e lista do que falta. */
export const SocialLogin = () => {
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState('');
    const [ocupado, setOcupado] = useState('');
    const [resultado, setResultado] = useState(null); // { tipo, texto }

    const carregar = useCallback(async (rota = '') => {
        setOcupado(rota ? 'verificar' : 'carregar');
        try {
            const r = rota ? await api.post(`${BASE}${rota}`) : await api.get(BASE);
            setDados(r.data); setErro('');
        } catch (err) { setErro(mensagemServidor(err, 'Não foi possível carregar a verificação.')); }
        finally { setOcupado(''); }
    }, []);
    useEffect(() => { carregar(); }, [carregar]);

    const alternar = async (alvo, ligado) => {
        setOcupado(alvo); setResultado(null);
        try {
            const r = await api.put(`${BASE}/${alvo}`, { ligado });
            setDados((d) => ({ ...d, interruptores: r.data.interruptores }));
            setResultado({ tipo: 'success', texto: `Login com Google ${ligado ? 'ligado' : 'desligado'} em ${alvo === 'site' ? 'arpt.site' : 'lojas'}.` });
        } catch (err) {
            const corpo = err?.response?.data;
            if (err?.response?.status === 409 && corpo?.itens) {
                setDados((d) => ({ ...d, itens: corpo.itens, pronto: false, pendencias: corpo.pendencias }));
                setResultado({ tipo: 'error', texto: `Não foi ligado: ${corpo.pendencias} item(ns) pendente(s) ou com falha. Resolva a lista abaixo e tente de novo.` });
            } else setResultado({ tipo: 'error', texto: mensagemServidor(err, 'Não foi possível alterar.') });
        } finally { setOcupado(''); }
    };

    const confirmar = async (id, confirmado) => {
        setOcupado(id);
        try { const r = await api.put(`${BASE}/confirmacoes/${id}`, { confirmado }); setDados((d) => ({ ...d, ...r.data })); }
        catch (err) { setResultado({ tipo: 'error', texto: mensagemServidor(err, 'Não foi possível registrar a confirmação.') }); }
        finally { setOcupado(''); }
    };

    if (!dados) return erro ? <Alert severity="error">{erro}</Alert> : <Box p={3} textAlign="center"><CircularProgress size={28} /></Box>;

    return (
        <Box sx={{ p: { xs: 1, md: 3 }, display: 'grid', gap: 2 }}>
            <Typography variant="h5">Login social (Google)</Typography>
            {erro && <Alert severity="error">{erro}</Alert>}
            {resultado && <Alert severity={resultado.tipo} onClose={() => setResultado(null)}>{resultado.texto}</Alert>}
            <Alert severity={dados.pronto ? 'success' : 'warning'} data-testid="resumo">
                {dados.pronto ? 'Todas as verificações obrigatórias estão ok: é possível ligar.' : `${dados.pendencias} item(ns) obrigatório(s) ainda não estão ok. Ligar fica bloqueado até resolver.`}
            </Alert>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                {ALVOS.map((a) => {
                    const ligado = !!dados.interruptores?.[a.id];
                    return (
                        <Paper key={a.id} variant="outlined" sx={{ p: 2, flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>{a.titulo}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{a.descr}</Typography>
                            <FormControlLabel
                                control={<Switch checked={ligado} disabled={!!ocupado} onChange={(e) => alternar(a.id, e.target.checked)} inputProps={{ 'aria-label': `Login com Google em ${a.titulo}` }} />}
                                label={ocupado === a.id ? 'Verificando…' : ligado ? 'Ligado' : 'Desligado'}
                            />
                        </Paper>
                    );
                })}
            </Stack>
            <Box>
                <Button variant="outlined" onClick={() => carregar('/verificar')} disabled={!!ocupado}>{ocupado === 'verificar' ? 'Verificando…' : 'Verificar agora'}</Button>
            </Box>

            {GRUPOS.map((g) => (
                <Box key={g}>
                    <Typography variant="h6" sx={{ mb: 1 }}>{g}</Typography>
                    <Stack spacing={1}>
                        {dados.itens.filter((i) => i.grupo === g).map((i) => {
                            const e = ESTADOS[i.estado] ?? ESTADOS.inconclusivo;
                            return (
                                <Paper key={i.id} variant="outlined" sx={{ p: 2 }} data-testid={`item-${i.id}`} data-estado={i.estado}>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                        <Chip size="small" color={e.cor} label={e.rotulo} />
                                        <Typography fontWeight={600}>{i.titulo}</Typography>
                                        <Chip size="small" variant="outlined" label={i.tipo === 'manual' ? 'Confirmação manual' : 'Automático'} />
                                        {i.gravidade === 'aviso' && <Chip size="small" variant="outlined" label="Só aviso" />}
                                    </Stack>
                                    <Typography variant="body2" sx={{ mt: 1 }}>{i.descricao}</Typography>
                                    {i.detalhe && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Lido: {i.detalhe}</Typography>}
                                    {i.estado !== 'ok' || i.tipo === 'manual' ? (
                                        <Typography variant="body2" sx={{ mt: 0.5 }}><strong>O que fazer:</strong> {i.acao}</Typography>
                                    ) : null}
                                    {i.tipo === 'manual' && i.estado !== 'ok' || (i.tipo === 'manual' && i.confirmado_por) ? (
                                        <FormControlLabel sx={{ mt: 0.5 }}
                                            control={<Checkbox checked={i.estado === 'ok'} disabled={!!ocupado} onChange={(ev) => confirmar(i.id, ev.target.checked)} />}
                                            label={i.confirmado_por ? `Já fiz (por ${i.confirmado_por}, ${new Date(i.confirmado_em).toLocaleString('pt-BR')})` : 'Já fiz'} />
                                    ) : null}
                                </Paper>
                            );
                        })}
                    </Stack>
                </Box>
            ))}
        </Box>
    );
};
