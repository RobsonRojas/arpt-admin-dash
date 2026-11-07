import { useEffect, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { api } from '../services/api';
import { mensagemServidor } from '../utils/monitoring';

const BASE = '/api/v1/admin/monitoring/push';

/** Chave VAPID (base64url) no formato que o `pushManager.subscribe` aceita. */
export const chaveParaBytes = (b64) => {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const bin = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const suportado = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/**
 * Ativa ou desativa as notificações de queda e volta de serviço neste navegador (add-admin-service-monitoring, 8.3). O e-mail continua
 * sendo o canal garantido; no iPhone, só funciona com o painel instalado na tela inicial.
 */
export const NotificacoesMonitoramento = () => {
    const [estado, setEstado] = useState('carregando'); // carregando | sem-suporte | desligado-servidor | bloqueado | inativo | ativo
    const [chave, setChave] = useState(null);
    const [erro, setErro] = useState('');
    const [ocupado, setOcupado] = useState(false);

    useEffect(() => {
        let vivo = true;
        (async () => {
            if (!suportado()) { setEstado('sem-suporte'); return; }
            try {
                const r = await api.get(`${BASE}/public-key`);
                if (!vivo) return;
                if (!r.data?.publicKey) { setEstado('desligado-servidor'); return; }
                setChave(r.data.publicKey);
                if (Notification.permission === 'denied') { setEstado('bloqueado'); return; }
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                if (vivo) setEstado(sub ? 'ativo' : 'inativo');
            } catch (err) {
                if (vivo) { setErro(mensagemServidor(err, 'Não foi possível consultar as notificações.')); setEstado('inativo'); }
            }
        })();
        return () => { vivo = false; };
    }, []);

    const ativar = async () => {
        setErro(''); setOcupado(true);
        try {
            const permissao = await Notification.requestPermission();
            if (permissao !== 'granted') { setEstado(permissao === 'denied' ? 'bloqueado' : 'inativo'); return; }
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaBytes(chave) });
            const json = sub.toJSON();
            await api.post(`${BASE}/subscriptions`, { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } });
            setEstado('ativo');
        } catch (err) {
            setErro(mensagemServidor(err, 'Não foi possível ativar as notificações neste navegador.'));
        } finally { setOcupado(false); }
    };

    const desativar = async () => {
        setErro(''); setOcupado(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await api.delete(`${BASE}/subscriptions`, { data: { endpoint: sub.endpoint } });
                await sub.unsubscribe();
            }
            setEstado('inativo');
        } catch (err) {
            setErro(mensagemServidor(err, 'Não foi possível desativar as notificações.'));
        } finally { setOcupado(false); }
    };

    if (estado === 'carregando') return null;
    return (
        <Box sx={{ mb: 2 }}>
            {erro && <Alert severity="error" sx={{ mb: 1 }}>{erro}</Alert>}
            {estado === 'sem-suporte' && <Typography variant="body2" color="text.secondary">Este navegador não recebe notificações do painel. No iPhone, instale o painel na tela inicial. Os alertas continuam chegando por e-mail.</Typography>}
            {estado === 'desligado-servidor' && <Typography variant="body2" color="text.secondary">Notificações no navegador desligadas no servidor. Os alertas chegam por e-mail.</Typography>}
            {estado === 'bloqueado' && <Alert severity="warning">As notificações estão bloqueadas para este site nas configurações do navegador.</Alert>}
            {estado === 'inativo' && <Button variant="outlined" size="small" onClick={ativar} disabled={ocupado}>Receber alertas neste navegador</Button>}
            {estado === 'ativo' && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="body2">Alertas de queda e volta ativos neste navegador.</Typography>
                    <Button size="small" onClick={desativar} disabled={ocupado}>Desativar</Button>
                </Box>
            )}
        </Box>
    );
};
