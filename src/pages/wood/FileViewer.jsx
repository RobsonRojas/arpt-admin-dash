import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle, Button, DialogActions } from '@mui/material';
import { api } from '../../services/api';
import { BASE } from '../../utils/wood';

/** Abre o arquivo do documento pela rota autenticada (fetch com token → blob URL), embutido para PDF e imagem. */
export function FileViewer({ documentoId, versao, onClose }) {
    const [url, setUrl] = useState(null);
    const [mime, setMime] = useState('');
    const [erro, setErro] = useState(null);

    useEffect(() => {
        let atual = null; let cancelado = false;
        api.get(`${BASE}/documents/${documentoId}/file`, { params: versao ? { version: versao } : {}, responseType: 'blob', timeout: 60000 })
            .then((r) => {
                if (cancelado) return;
                atual = URL.createObjectURL(r.data); setUrl(atual); setMime(r.data?.type || r.headers?.['content-type'] || '');
            })
            .catch(() => !cancelado && setErro('Não foi possível abrir o arquivo.'));
        return () => { cancelado = true; if (atual) URL.revokeObjectURL(atual); };
    }, [documentoId, versao]);

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>Documento {documentoId}{versao ? ` · versão ${versao}` : ''}</DialogTitle>
            <DialogContent sx={{ minHeight: 400 }}>
                {erro && <Alert severity="error">{erro}</Alert>}
                {!url && !erro && <CircularProgress size={24} />}
                {url && String(mime).startsWith('image/') && <Box component="img" src={url} alt="Documento enviado" sx={{ maxWidth: '100%' }} />}
                {url && !String(mime).startsWith('image/') && <Box component="iframe" src={url} title="Documento enviado" sx={{ width: '100%', height: '70vh', border: 0 }} />}
            </DialogContent>
            <DialogActions>
                {url && <Button href={url} target="_blank" rel="noreferrer">Abrir em nova aba</Button>}
                <Button onClick={onClose}>Fechar</Button>
            </DialogActions>
        </Dialog>
    );
}
