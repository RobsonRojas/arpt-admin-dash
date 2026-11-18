import { useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { api } from '../../services/api';
import { BASE, mensagemErro } from '../../utils/wood';
import { FileViewer } from './FileViewer';
import { ReasonDialog } from './ReasonDialog';

/** Ver o arquivo e decidir uma versão de documento (aprovar, recusar ou pedir correção, com motivo). */
export function DocumentDecision({ documentoId, versao, onDone }) {
    const [ver, setVer] = useState(false);
    const [motivoDe, setMotivoDe] = useState(null);
    const [erro, setErro] = useState(null);
    const [ok, setOk] = useState(null);

    const decidir = async (decisao, motivo) => {
        setErro(null);
        try {
            await api.post(`${BASE}/documents/${documentoId}/decision`, { decisao, ...(motivo ? { motivo } : {}), versao });
            setMotivoDe(null); setOk('Decisão registrada. O produtor foi avisado.'); onDone?.();
        } catch (e) { setErro(mensagemErro(e)); }
    };
    return (
        <>
            {erro && !motivoDe && <Alert severity="error" sx={{ my: 1 }}>{erro}</Alert>}
            {ok && <Alert severity="success" sx={{ my: 1 }}>{ok}</Alert>}
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ my: 1 }}>
                <Button size="small" onClick={() => setVer(true)}>Ver arquivo</Button>
                <Button size="small" variant="contained" color="success" onClick={() => decidir('APROVAR')}>Aprovar documento</Button>
                <Button size="small" color="warning" onClick={() => { setErro(null); setMotivoDe('PEDIR_CORRECAO'); }}>Pedir correção</Button>
                <Button size="small" color="error" onClick={() => { setErro(null); setMotivoDe('RECUSAR'); }}>Recusar</Button>
            </Stack>
            {ver && <FileViewer documentoId={documentoId} versao={versao} onClose={() => setVer(false)} />}
            {motivoDe && (
                <ReasonDialog titulo={motivoDe === 'RECUSAR' ? 'Recusar documento' : 'Pedir correção do documento'} descricao="O motivo é obrigatório e vai para o produtor."
                    confirmar={motivoDe === 'RECUSAR' ? 'Recusar' : 'Pedir correção'} erro={erro} onConfirm={(m) => decidir(motivoDe, m)} onClose={() => setMotivoDe(null)} />
            )}
        </>
    );
}
