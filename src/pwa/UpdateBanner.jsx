import { useSyncExternalStore } from 'react';
import { Alert, Button, Snackbar } from '@mui/material';
import { guard } from './versionWatch';

/** "Nova versão disponível — Atualizar": aparece quando a atualização espera um diálogo fechar. Não bloqueia a tela. */
export default function UpdateBanner() {
    const pending = useSyncExternalStore(guard.subscribe, guard.isPending, guard.isPending);
    if (!pending) return null;
    return (
        <Snackbar open anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert
                severity="info"
                variant="filled"
                action={<Button color="inherit" size="small" onClick={() => guard.applyUpdate({ force: true })}>Atualizar</Button>}
            >
                Nova versão disponível
            </Alert>
        </Snackbar>
    );
}
