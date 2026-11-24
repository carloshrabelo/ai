// Substitui o service worker do app antigo (carloshrabelo.dev/ai/sw.js). Quem tem o app instalado ou
// já visitou recebe este arquivo na próxima abertura: ele apaga os caches, se desregistra e recarrega
// as abas abertas, que então chegam ao index.html / 404.html deste repositório e vão para o domínio
// novo (redirect.js). Sem isso, o service worker antigo serviria a versão em cache para sempre.

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim()
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)))
      await self.registration.unregister()
      const windows = await self.clients.matchAll({ type: 'window' })
      await Promise.all(windows.map((client) => client.navigate(client.url).catch(() => undefined)))
    })(),
  )
})
