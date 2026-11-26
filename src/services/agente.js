import { api } from './api';
import { auth } from './firebase';

/** Cliente do agente de IA (agente-ia-admin-dash). Fala só com a manejo-api autenticada; nenhuma chave de IA existe no navegador. */
export const estadoDoAgente = async () => {
    try { return (await api.get('/admin/agent/estado')).data; } catch { return { habilitado: false }; }
};

export const confirmarProposta = async (id) => (await api.post(`/admin/agent/proposals/${id}/confirm`, {})).data;
export const rejeitarProposta = async (id) => (await api.post(`/admin/agent/proposals/${id}/reject`, {})).data;

/** Lê o texto SSE em blocos "event: x\ndata: {...}". Exportada para teste. */
export function* eventosDoTexto(buffer) {
    const blocos = buffer.split('\n\n');
    const resto = blocos.pop();
    for (const b of blocos) {
        const linha = b.split('\n').find((l) => l.startsWith('data: '));
        if (linha) { try { yield { evento: JSON.parse(linha.slice(6)) }; } catch { /* bloco ilegível */ } }
    }
    yield { resto };
}

async function token() {
    if (import.meta.env.VITE_SKIP_AUTH === 'true') return 'test-admin-token';
    return auth?.currentUser ? auth.currentUser.getIdToken(true) : '';
}

/** Envia a mensagem e chama `aoEvento` para cada evento SSE. Erros HTTP (503 desligado, 429 teto) viram `{tipo:'erro'}`. */
export async function conversarComAgente({ mensagem, sessaoId, aoEvento, signal }) {
    const base = String(api.defaults?.baseURL ?? '').replace(/\/$/, '');
    const resp = await fetch(`${base}/admin/agent`, {
        method: 'POST', signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
        body: JSON.stringify(sessaoId ? { mensagem, sessaoId } : { mensagem }),
    });
    if (!resp.ok) {
        const corpo = await resp.json().catch(() => ({}));
        aoEvento({ tipo: 'erro', codigo: corpo.code ?? `HTTP_${resp.status}`, status: resp.status, mensagem: corpo.error ?? 'Não foi possível falar com o agente.' });
        return;
    }
    const leitor = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        for (const item of eventosDoTexto(buf)) {
            if (item.evento) aoEvento(item.evento);
            else buf = item.resto;
        }
    }
}
