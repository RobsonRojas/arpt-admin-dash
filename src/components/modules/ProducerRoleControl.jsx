import { useEffect, useState } from 'react';
import { Alert, Box, Chip, CircularProgress, FormControlLabel, Switch, Typography } from '@mui/material';
import { api } from '../../services/api';

/**
 * Papel `produtor` de um usuário (add-producer-role-self-service). O estado vem do Keycloak, pela API; este controle só pede a mudança.
 * Não confundir com a "Função" da lista (Administrador, Gestor, Operador, Visualizador), que é outro conceito, gravado em arpt_users.
 * Concede direto; retirar pede confirmação. Se a alteração falhar, o estado exibido continua o anterior.
 */
export const ProducerRoleControl = ({ userId, getToken }) => {
    const [estado, setEstado] = useState('carregando'); // carregando | ok | erro
    const [produtor, setProdutor] = useState(false);
    const [proprietario, setProprietario] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState(null);

    const headers = async () => ({ Authorization: `Bearer ${await getToken()}` });

    useEffect(() => {
        let vivo = true;
        setEstado('carregando');
        setErro(null);
        (async () => {
            try {
                const r = await api.get(`/admin/users/${userId}/roles`, { headers: await headers() });
                if (!vivo) return;
                setProdutor(!!r.data?.produtor);
                setProprietario(!!r.data?.proprietario);
                setEstado('ok');
            } catch {
                if (vivo) setEstado('erro');
            }
        })();
        return () => { vivo = false; };
    }, [userId]);

    const alterar = async (enabled) => {
        if (!enabled && !window.confirm('Retirar o papel de produtor? O usuário deixa de cadastrar e editar produtos. Os produtos já cadastrados continuam como estão.')) return;
        setSalvando(true);
        setErro(null);
        try {
            const r = await api.put(`/admin/users/${userId}/producer-role`, { enabled }, { headers: await headers() });
            setProdutor(!!r.data?.produtor);
        } catch (err) {
            setErro(err?.response?.data?.error || 'Não foi possível alterar o papel de produtor.');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Box mt={3} mb={4} p={2} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }} data-producer-role>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Papel de produtor</Typography>
            {estado === 'carregando' && <CircularProgress size={22} aria-label="Carregando papéis" />}
            {estado === 'erro' && <Alert severity="error">Não foi possível ler os papéis deste usuário no Keycloak.</Alert>}
            {estado === 'ok' && (
                <>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Chip size="small" label={produtor ? 'Produtor ativo' : 'Sem papel de produtor'} color={produtor ? 'success' : 'default'} data-producer-chip />
                        {proprietario && <Chip size="small" label="Proprietário" variant="outlined" />}
                    </Box>
                    <FormControlLabel
                        control={<Switch checked={produtor} disabled={salvando} onChange={(e) => alterar(e.target.checked)} />}
                        label="Pode fornecer produtos (papel produtor no Keycloak)"
                    />
                    {erro && <Alert severity="error" sx={{ mt: 1 }}>{erro}</Alert>}
                </>
            )}
        </Box>
    );
};
