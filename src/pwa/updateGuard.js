/**
 * Recarregamento da aba quando uma nova versão do painel assume o controle (force-pwa-refresh-on-update).
 *
 * Regras (specs/pwa-support): recarrega uma vez por versão e por aba; nunca offline; com diálogo aberto, não recarrega
 * e deixa a atualização pendente, aplicada quando o diálogo fecha ou quando o usuário pede. Sem globais: as dependências
 * entram pela fábrica, para o teste rodar no Node (scripts/check-pwa-update.mjs).
 */

/** Chave do marcador na sessionStorage: o id do build em que esta aba já recarregou. */
export const MARKER_KEY = 'arpt-admin:pwa-reloaded-from';

export function createUpdateGuard({ buildId, storage, reload, isOnline, hasOpenDialog }) {
    let pending = false;
    const listeners = new Set();

    function setPending(value) {
        if (pending === value) return;
        pending = value;
        listeners.forEach((listener) => listener());
    }

    /** A aba já deixou esta versão (o marcador é o build atual): não há o que recarregar. */
    function alreadyLeftThisBuild() {
        return storage?.getItem(MARKER_KEY) === buildId;
    }

    /**
     * Recarrega se for seguro. `force` vem do botão "Atualizar" e ignora o diálogo aberto (o usuário decidiu).
     * Devolve true se mandou recarregar.
     */
    function applyUpdate({ force = false } = {}) {
        if (alreadyLeftThisBuild()) {
            setPending(false);
            return false;
        }
        if (!isOnline()) {
            setPending(true); // aplicada quando a conexão voltar (ver o evento `online` em versionWatch.js)
            return false;
        }
        if (!force && hasOpenDialog()) {
            setPending(true); // aplicada quando o diálogo fechar
            return false;
        }
        storage?.setItem(MARKER_KEY, buildId);
        reload();
        return true;
    }

    return {
        buildId,
        isPending: () => pending,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        /** Um worker novo assumiu o controle desta aba: a versão mudou. */
        markNewVersion() {
            setPending(true);
            return applyUpdate();
        },
        applyUpdate,
        /** Chamado quando o DOM muda: se a atualização estava esperando um diálogo fechar, aplica agora. */
        onDialogsChanged() {
            if (pending && !hasOpenDialog()) applyUpdate();
        },
    };
}
