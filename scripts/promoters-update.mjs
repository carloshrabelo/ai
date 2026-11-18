// Atualiza src/data/promoters.json com os perfis do Instagram citados nos eventos, como o
// venues:check faz com os locais. Para cada perfil: papel (promotor = linha "Mais info: @…"; DJ,
// professor, local ou outro pelo contexto), redes sociais, locais, estilos e o último dia em que
// apareceu (sem a lista de eventos). Não apaga ninguém, e o que já está no arquivo (inclusive editado
// à mão: name, role, redes, aliases) fica. Lista no fim os perfis com grafia parecida (erros de
// digitação) para juntar com "aliases". Roda todo dia na Action "Update promoters".
//
// Uso: pnpm promoters:update [dias à frente] [dias para trás]   (padrão: 90 e 30)
// Usa sempre a Google Calendar API (nunca o mock). Lê VITE_GOOGLE_API_KEY do ambiente ou do .env.local.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = join(root, 'src/data/promoters.json')
const [daysAfter = 90, DAYS_BEFORE = 30] = process.argv.slice(2).filter((arg) => /^\d+$/.test(arg)).map(Number)

// Dados reais: o ambiente vence o .env.local no Vite.
process.env.VITE_USE_MOCK = 'false'

// A chave da API é restrita por referer (o site publicado).
const originalFetch = globalThis.fetch
globalThis.fetch = (input, init = {}) => {
  const url = String(input instanceof Request ? input.url : input)
  if (!url.startsWith('https://www.googleapis.com/')) return originalFetch(input, init)
  const headers = new Headers(init.headers)
  headers.set('Referer', 'https://carloshrabelo.github.io/ai/')
  return originalFetch(input, { ...init, headers })
}

const vite = await createServer({
  root,
  configFile: false,
  logLevel: 'warn',
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false },
  define: { __APP_VERSION__: '"promoters"', __APP_BUILD_TIME__: '""', __PWA_IN_DEV__: 'false' },
})

try {
  const { GOOGLE_API_KEY } = await vite.ssrLoadModule('/src/data/config.ts')
  if (!GOOGLE_API_KEY) throw new Error('VITE_GOOGLE_API_KEY não encontrada (ambiente ou .env.local).')
  const { loadEvents } = await vite.ssrLoadModule('/src/data/loadEvents.ts')
  const { addDays, lisbonDate, todayIso } = await vite.ssrLoadModule('/src/data/dates.ts')
  const { collectPromoters, mergePromoters, similarHandles } = await vite.ssrLoadModule('/src/domain/promoterDirectory.ts')

  const today = todayIso()
  const events = await loadEvents(addDays(today, -DAYS_BEFORE), addDays(today, daysAfter))
  const found = collectPromoters(events, (event) => lisbonDate(event.start))

  const existing = JSON.parse(readFileSync(FILE, 'utf8'))
  const merged = mergePromoters(existing, found)
  const aliases = new Set(Object.values(merged).flatMap((entry) => entry.aliases ?? []))
  const added = Object.keys(found).filter((handle) => !existing[handle] && !aliases.has(handle))

  writeFileSync(FILE, `${JSON.stringify(merged, null, 2)}\n`)
  console.log(
    `${events.length} eventos (${DAYS_BEFORE} dias atrás a ${daysAfter} à frente); ${Object.keys(found).length} perfis citados; ` +
      `${added.length} novos; ${Object.keys(merged).length} no arquivo.`,
  )
  for (const handle of added) console.log(`  + @${handle} (${merged[handle].role})`)
  const roles = Object.groupBy(Object.values(merged), (entry) => entry.role)
  console.log(`Papéis: ${Object.entries(roles).map(([role, list]) => `${role} ${list.length}`).join(', ')}.`)

  // Grafias parecidas: revisar e, se for o mesmo perfil, acrescentar em `aliases` do perfil certo.
  const suspects = similarHandles(Object.keys(merged))
  if (suspects.length > 0) {
    console.log(`\nPossíveis duplicados (${suspects.length}): se forem o mesmo perfil, use "aliases" no promoters.json.`)
    for (const [a, b] of suspects) console.log(`  @${a} × @${b}`)
  }
} catch (error) {
  console.error(`promoters:update: ${error.message}`)
  process.exitCode = 1
} finally {
  await vite.close()
}
