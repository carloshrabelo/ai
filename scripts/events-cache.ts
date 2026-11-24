// Gera o cache dos eventos (.cache/events.json): os três calendários de 30 dias atrás a 90 à frente,
// direto da Google Calendar API. Se a API falhar, usa como base o cache publicado no site (do último
// deploy) ou o que já estava no disco. Os scripts venues:check, promoters:update e o prerender partem
// dele, e o build o publica como /events-cache.json (o app o usa quando a API falha).
//
// Uso: pnpm events:cache          (roda na Action diária "Update data", antes de venues e promoters)
// Saída: 1 só se não houver nenhum cache (nem da API, nem do site, nem do disco).
// Lê VITE_GOOGLE_API_KEY do ambiente ou do .env.local.
import { CACHE_PATH, generateCache } from './lib/eventsCache.ts'
import { startApp } from './lib/app.ts'

const app = await startApp({ name: 'events-cache', realData: true })
try {
  const { cache, origin } = await generateCache(app)
  const bySource = Object.groupBy(cache.items, (item) => item.source ?? 'pasdedeux')
  const counts = Object.entries(bySource)
    .map(([source, items]) => `${source} ${items?.length ?? 0}`)
    .join(', ')
  const from = origin === 'api' ? 'da API' : origin === 'site' ? 'do site (API indisponível)' : 'do disco (API e site indisponíveis)'
  console.log(`events:cache: ${cache.items.length} eventos ${from}, de ${cache.from} a ${cache.to} (${counts}) → ${CACHE_PATH}`)
} catch (error) {
  console.error(`events:cache: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  await app.close()
}
