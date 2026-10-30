import { useCallback, useEffect, useState } from 'react';
import {
    Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
    List, ListItem, ListItemText, TextField, Typography,
} from '@mui/material';
import { api } from '../../../services/api';
import { dataBr, mensagemErro, nomeUsuario } from '../../../utils/growthAdmin';

/** Donos do negócio: o proprietário da propriedade (não sai daqui) e os responsáveis delegados, que o administrador vincula e desvincula. */
export const ResponsaveisTab = ({ projectId }) => {
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState('');
    const [busca, setBusca] = useState('');
    const [opcoes, setOpcoes] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [escolhido, setEscolhido] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [desvincular, setDesvincular] = useState(null);

    const carregar = useCallback(async () => {
        setErro('');
        try {
            const r = await api.get(`/admin/projetos/${projectId}/responsaveis`);
            setDados(r.data);
        } catch (err) {
            setErro(mensagemErro(err, 'Não foi possível carregar os donos do negócio.'));
        }
    }, [projectId]);

    useEffect(() => { carregar(); }, [carregar]);

    useEffect(() => {
        if (busca.trim().length < 2) { setOpcoes([]); return undefined; }
        let ativo = true;
        setBuscando(true);
        api.get('/user/search', { params: { q: busca.trim() } })
            .then((r) => { if (ativo) setOpcoes(Array.isArray(r.data) ? r.data : []); })
            .catch(() => { if (ativo) setOpcoes([]); })
            .finally(() => { if (ativo) setBuscando(false); });
        return () => { ativo = false; };
    }, [busca]);

    const vincular = async () => {
        if (!escolhido) return;
        setSalvando(true); setErro('');
        try {
            await api.post(`/admin/projetos/${projectId}/responsaveis`, { user_id: escolhido.id });
            setEscolhido(null); setBusca('');
            await carregar();
        } catch (err) {
            setErro(mensagemErro(err, 'Não foi possível vincular o usuário.'));
        } finally {
            setSalvando(false);
        }
    };

    const confirmarDesvinculo = async () => {
        const alvo = desvincular;
        setDesvincular(null); setErro('');
        try {
            await api.delete(`/admin/projetos/${projectId}/responsaveis/${alvo.user_id}`);
            await carregar();
        } catch (err) {
            setErro(mensagemErro(err, 'Não foi possível desvincular o usuário.'));
        }
    };

    if (!dados && !erro) return <Box p={3} textAlign="center"><CircularProgress size={28} /></Box>;

    const proprietarioId = dados?.proprietario?.user_id;
    return (
        <Box>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            {dados && (
                <>
                    <Typography variant="subtitle2" gutterBottom>Proprietário da propriedade</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }} data-testid="proprietario">
                        {dados.proprietario ? (dados.proprietario.nome || dados.proprietario.user_id) : 'Sem proprietário vinculado à propriedade.'}
                    </Typography>

                    <Typography variant="subtitle2">Responsáveis delegados</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Podem publicar atualizações e gerenciar relatórios de impacto deste negócio, como o proprietário.
                    </Typography>
                    {dados.responsaveis.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Nenhum responsável delegado.</Typography>
                    ) : (
                        <List dense sx={{ mb: 2 }}>
                            {dados.responsaveis.map((r) => (
                                <ListItem key={r.user_id} disableGutters secondaryAction={
                                    <Button size="small" color="error" onClick={() => setDesvincular(r)}>Desvincular</Button>
                                }>
                                    <ListItemText
                                        primary={r.nome || r.user_id}
                                        secondary={`Vinculado em ${dataBr(r.created_at)}${r.user_id === proprietarioId ? ' · também é o proprietário' : ''}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}

                    <Box display="flex" gap={1} alignItems="flex-start" flexWrap="wrap">
                        <Autocomplete
                            sx={{ flex: '1 1 260px' }}
                            options={opcoes}
                            loading={buscando}
                            value={escolhido}
                            filterOptions={(x) => x}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            getOptionLabel={(o) => `${nomeUsuario(o)}${o.email ? ` (${o.email})` : ''}`}
                            onChange={(_, v) => setEscolhido(v)}
                            onInputChange={(_, v) => setBusca(v)}
                            noOptionsText={busca.trim().length < 2 ? 'Digite ao menos 2 letras' : 'Nenhum usuário encontrado'}
                            renderInput={(params) => <TextField {...params} size="small" label="Buscar usuário (nome ou e-mail)" />}
                        />
                        <Button variant="contained" onClick={vincular} disabled={!escolhido || salvando}>Vincular</Button>
                    </Box>
                </>
            )}

            <Dialog open={!!desvincular} onClose={() => setDesvincular(null)}>
                <DialogTitle>Desvincular responsável?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        {desvincular?.nome || desvincular?.user_id} deixa de publicar atualizações e de gerenciar relatórios deste negócio
                        {desvincular?.user_id === proprietarioId ? ', exceto como proprietário da propriedade, que continua.' : '.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDesvincular(null)}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={confirmarDesvinculo}>Desvincular</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
