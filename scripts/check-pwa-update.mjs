import assert from 'node:assert/strict';
import { createUpdateGuard, MARKER_KEY } from '../src/pwa/updateGuard.js';

// Armazenamento de mentira: a mesma sessionStorage entre "recarregamentos" da mesma aba.
function memoria() {
  const dados = new Map();
  return { getItem: (k) => (dados.has(k) ? dados.get(k) : null), setItem: (k, v) => dados.set(k, String(v)) };
}

function aba({ buildId, storage, online = true, dialogo = false }) {
  const estado = { online, dialogo, recarregou: 0 };
  const guard = createUpdateGuard({
    buildId,
    storage,
    reload: () => { estado.recarregou++; },
    isOnline: () => estado.online,
    hasOpenDialog: () => estado.dialogo,
  });
  return { guard, estado };
}

// recarrega uma vez por versão
{
  const storage = memoria();
  const { guard, estado } = aba({ buildId: 'v1', storage });
  guard.markNewVersion();
  assert.equal(estado.recarregou, 1);
  assert.equal(storage.getItem(MARKER_KEY), 'v1');
}

// não entra em loop: a aba que já deixou v1 não recarrega de novo se v1 voltar a assumir o controle
{
  const storage = memoria();
  storage.setItem(MARKER_KEY, 'v1');
  const { guard, estado } = aba({ buildId: 'v1', storage });
  assert.equal(guard.markNewVersion(), false);
  assert.equal(estado.recarregou, 0);
  assert.equal(guard.isPending(), false);
}

// versão nova depois de outra: recarrega de novo (é outra versão)
{
  const storage = memoria();
  storage.setItem(MARKER_KEY, 'v1');
  const { guard, estado } = aba({ buildId: 'v2', storage });
  guard.markNewVersion();
  assert.equal(estado.recarregou, 1);
}

// offline: não recarrega e deixa pendente; ao voltar a conexão, recarrega
{
  const storage = memoria();
  const { guard, estado } = aba({ buildId: 'v1', storage, online: false });
  guard.markNewVersion();
  assert.equal(estado.recarregou, 0);
  assert.equal(guard.isPending(), true);
  estado.online = true;
  guard.applyUpdate();
  assert.equal(estado.recarregou, 1);
}

// diálogo aberto: adia, fica pendente e aplica quando o diálogo fecha
{
  const storage = memoria();
  const { guard, estado } = aba({ buildId: 'v1', storage, dialogo: true });
  guard.markNewVersion();
  assert.equal(estado.recarregou, 0);
  assert.equal(guard.isPending(), true);
  guard.onDialogsChanged(); // ainda com o diálogo aberto
  assert.equal(estado.recarregou, 0);
  estado.dialogo = false;
  guard.onDialogsChanged();
  assert.equal(estado.recarregou, 1);
  assert.equal(guard.isPending(), true); // a aba recarrega; o estado pendente só some com a página nova
}

// o botão "Atualizar" recarrega mesmo com diálogo aberto (o usuário decidiu)
{
  const storage = memoria();
  const { guard, estado } = aba({ buildId: 'v1', storage, dialogo: true });
  guard.markNewVersion();
  assert.equal(guard.applyUpdate({ force: true }), true);
  assert.equal(estado.recarregou, 1);
}

// quem assina a mudança é avisado (banner)
{
  const { guard } = aba({ buildId: 'v1', storage: memoria(), dialogo: true });
  let avisos = 0;
  const parar = guard.subscribe(() => avisos++);
  guard.markNewVersion();
  assert.ok(avisos >= 1);
  parar();
}

console.log('check-pwa-update: ok');
