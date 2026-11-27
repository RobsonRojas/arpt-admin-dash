import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { api } from '../../services/api';

/**
 * Selo "Licenciado" do projeto de manejo (origem-madeira-arvore-manejo-ou-caida). Só o administrador define; é independente da situação
 * comercial do projeto. Só as árvores de projeto com o selo ativo (licença dentro da validade) podem ser escolhidas na origem da madeira.
 */
export const LicencaDoProjeto = ({ projectId }) => {
    const [carregando, setCarregando] = useState(true);
    const [licenciado, setLicenciado] = useState(false);
    const [numero, setNumero] = useState('');
    const [validade, setValidade] = useState('');
    const [selo, setSelo] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [aviso, setAviso] = useState(null);

    const aplicar = (m) => {
        setLicenciado(!!m?.licenciado);
        setNumero(m?.licenca_numero ?? '');
        setValidade(m?.licenca_validade ? String(m.licenca_validade).slice(0, 10) : '');
        setSelo(m?.selo_licenciado ?? null);
    };

    useEffect(() => {
        let ativo = true;
        setCarregando(true); setAviso(null);
        api.get(`/admin/manejo/${projectId}`)
            .then((r) => { if (ativo) aplicar(Array.isArray(r.data) ? r.data[0] : r.data); })
            .catch(() => { if (ativo) setAviso({ tipo: 'error', texto: 'Não foi possível carregar a licença do projeto.' }); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, [projectId]);

    const salvar = async () => {
        setSalvando(true); setAviso(null);
        try {
            const corpo = licenciado ? { licenciado: true, licenca_numero: numero.trim(), licenca_validade: validade || null } : { licenciado: false };
            const r = await api.put(`/admin/manejo/${projectId}/licenca`, corpo);
            aplicar(r.data);
            setAviso({ tipo: 'success', texto: licenciado ? 'Selo Licenciado salvo.' : 'Selo Licenciado removido.' });
        } catch (e) {
            const d = e?.response?.data;
            setAviso({ tipo: 'error', texto: d?.detalhes?.[0]?.mensagem ?? d?.error ?? 'Não foi possível salvar a licença.' });
        } finally { setSalvando(false); }
    };

    if (carregando) return <CircularProgress size={18} aria-label="Carregando a licença" />;
    return (
        <Box data-testid="licenca-do-projeto">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Licença do projeto</Typography>
                {selo && <Chip size="small" color={selo.ativo ? 'success' : 'warning'} label={selo.rotulo_pt} data-testid="selo-licenciado" />}
            </Stack>
            <FormControlLabel control={<Switch checked={licenciado} onChange={(e) => setLicenciado(e.target.checked)} />} label="Projeto licenciado" />
            {licenciado && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                    <TextField size="small" label="Número da licença" value={numero} onChange={(e) => setNumero(e.target.value)} required inputProps={{ maxLength: 120 }} />
                    <TextField size="small" type="date" label="Validade" value={validade} onChange={(e) => setValidade(e.target.value)} InputLabelProps={{ shrink: true }} helperText="Em branco = sem validade" />
                </Stack>
            )}
            <Button sx={{ mt: 1.5 }} variant="outlined" onClick={salvar} disabled={salvando || (licenciado && !numero.trim())}>{salvando ? 'Salvando...' : 'Salvar licença'}</Button>
            {aviso && <Alert severity={aviso.tipo} sx={{ mt: 1 }}>{aviso.texto}</Alert>}
        </Box>
    );
};
