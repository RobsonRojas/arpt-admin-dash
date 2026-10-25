import { registerSW } from 'virtual:pwa-register';
import { createUpdateGuard } from './updateGuard.js';

// `__APP_BUILD_ID__` vem do `define` do vite.config.js.
function sessionStorageOuNada() {
    try {
        return window.sessionStorage;
    } catch {
        return null; // navegador sem armazenamento (modo privado restrito): o pior caso é um recarregamento extra
    }
}

/** Estado da atualização do painel. O banner (UpdateBanner.jsx) lê deste objeto. */
export const guard = createUpdateGuard({
    buildId: __APP_BUILD_ID__,
    storage: sessionStorageOuNada(),
    reload: () => window.location.reload(),
    isOnline: () => navigator.onLine,
    hasOpenDialog: () => document.querySelector('.MuiDialog-root') !== null,
});

/**
 * Registra o service worker (o script automático está desligado no vite.config.js) e liga a atualização:
 * - o worker novo é ativado sem esperar as outras abas (skipWaiting), sem o recarregamento automático do plugin;
 * - quando ele assume a aba, o `guard` recarrega uma vez, respeitando diálogo aberto e offline;
 * - ao voltar a conexão ou fechar o diálogo, a atualização pendente é aplicada.
 */
export function startVersionWatch() {
    if (!('serviceWorker' in navigator)) return;

    const atualizarWorker = registerSW({
        immediate: true,
        onNeedRefresh() {
            // Só ativa o worker novo. O recarregamento é do `guard`, que respeita as regras de segurança.
            atualizarWorker(false);
        },
        onOfflineReady() {
            // O app já roda do cache: nada a fazer.
        },
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => guard.markNewVersion());
    window.addEventListener('online', () => guard.applyUpdate());
    new MutationObserver(() => guard.onDialogsChanged()).observe(document.body, { childList: true, subtree: true });
}
