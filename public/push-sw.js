/* Notificações de monitoramento (add-admin-service-monitoring, 8.3). Importado pelo service worker gerado pelo vite-plugin-pwa. */
self.addEventListener('push', (event) => {
  let dados = {};
  try { dados = event.data ? event.data.json() : {}; } catch { dados = {}; }
  const titulo = typeof dados.titulo === 'string' ? dados.titulo : 'ARPT: estado de um serviço mudou';
  event.waitUntil(self.registration.showNotification(titulo, {
    body: typeof dados.texto === 'string' ? dados.texto : '',
    tag: typeof dados.tag === 'string' ? dados.tag : 'monitoramento',
    renotify: true,
    icon: '/arpt-logo-new.png',
    data: { url: typeof dados.url === 'string' && dados.url.startsWith('/') ? dados.url : '/monitoring' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || '/monitoring', self.location.origin).href;
  event.waitUntil((async () => {
    const abas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const aba of abas) {
      if (new URL(aba.url).origin === self.location.origin) {
        await aba.focus();
        return aba.navigate(destino);
      }
    }
    return self.clients.openWindow(destino);
  })());
});
