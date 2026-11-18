import type { ToolMatch } from '../domain/spelling'

// Ortografia pela API pública e gratuita do LanguageTool (sem chave). Limites por IP: 20 requisições e
// 75 KB por minuto, 20 KB por requisição. Os textos vão juntos em lotes de até BATCH_BYTES, numa fila
// que respeita os limites, e o resultado de cada texto fica salvo no aparelho: ao voltar à página só
// os textos novos ou alterados são verificados.

const API = 'https://api.languagetool.org/v2/check'
const BATCH_BYTES = 15_000
const PER_MINUTE = { requests: 18, bytes: 70_000 }
const SEPARATOR = '\n\n\n'
const CACHE_KEY = 'lisbon-social-dance:spelling-v1'
const CACHE_LIMIT = 2_000

export type SpellLanguage = 'pt-PT' | 'pt-BR' | 'en-US' | 'es'

// --- Cache no localStorage (falha em silêncio: sem storage, só verifica de novo) ---

type Cache = Record<string, ToolMatch[]>

function readCache(): Cache {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}') as Cache
  } catch {
    return {}
  }
}

function writeCache(cache: Cache) {
  try {
    const entries = Object.entries(cache)
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries.slice(-CACHE_LIMIT))))
  } catch {
    // cheio ou bloqueado
  }
}

/** Hash curto (FNV-1a) para a chave do cache. */
function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  return `${(h >>> 0).toString(36)}-${text.length}`
}

// --- Fila com os limites da API ---

const sent: { at: number; bytes: number }[] = []
let queue: Promise<unknown> = Promise.resolve()

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })

async function throttle(bytes: number, signal?: AbortSignal) {
  for (;;) {
    const now = Date.now()
    while (sent.length > 0 && now - sent[0].at > 60_000) sent.shift()
    const used = sent.reduce((sum, item) => sum + item.bytes, 0)
    if (sent.length < PER_MINUTE.requests && used + bytes <= PER_MINUTE.bytes) break
    await wait(60_000 - (now - sent[0].at) + 100, signal)
  }
  sent.push({ at: Date.now(), bytes })
}

/** Uma requisição, na vez dela na fila. */
function request(text: string, language: SpellLanguage, signal?: AbortSignal): Promise<ToolMatch[]> {
  const body = new URLSearchParams({ text, language, enabledOnly: 'true', enabledCategories: 'TYPOS' })
  const run = queue.then(async () => {
    await throttle(new TextEncoder().encode(body.toString()).length, signal)
    const response = await fetch(API, { method: 'POST', body, signal })
    if (!response.ok) throw new Error(`LanguageTool: ${response.status} ${response.statusText}`)
    const data = (await response.json()) as { matches: (ToolMatch & { rule: { issueType: string } })[] }
    return data.matches
      .filter((match) => match.rule.issueType === 'misspelling')
      .map(({ offset, length, replacements }) => ({ offset, length, replacements: replacements.slice(0, 8) }))
  })
  queue = run.catch(() => undefined)
  return run
}

/** Lotes de textos que cabem numa requisição (texto maior que o lote vai sozinho). */
function batches(texts: string[]): string[][] {
  const result: string[][] = []
  let current: string[] = []
  let size = 0
  for (const text of texts) {
    const bytes = new TextEncoder().encode(text).length + SEPARATOR.length
    if (current.length > 0 && size + bytes > BATCH_BYTES) {
      result.push(current)
      current = []
      size = 0
    }
    current.push(text)
    size += bytes
  }
  if (current.length > 0) result.push(current)
  return result
}

/**
 * Erros de ortografia de cada texto numa língua (na mesma ordem de `texts`). `onProgress` recebe
 * quantos textos já foram verificados.
 */
export async function checkSpelling(
  texts: string[],
  language: SpellLanguage,
  { signal, onProgress }: { signal?: AbortSignal; onProgress?: (done: number) => void } = {},
): Promise<ToolMatch[][]> {
  const cache = readCache()
  const keyOf = (text: string) => `${language}:${hash(text)}`
  const missing = [...new Set(texts.filter((text) => text.trim() && !cache[keyOf(text)]))]
  let done = texts.length - missing.length
  onProgress?.(done)

  for (const batch of batches(missing)) {
    // Texto maior que o lote vai cortado (as descrições ficam bem abaixo disso).
    const parts = batch.map((text) => text.slice(0, BATCH_BYTES / 2))
    const matches = await request(parts.join(SEPARATOR), language, signal)
    let start = 0
    for (const [i, text] of batch.entries()) {
      const end = start + parts[i].length
      cache[keyOf(text)] = matches
        .filter((match) => match.offset >= start && match.offset + match.length <= end)
        .map((match) => ({ ...match, offset: match.offset - start }))
      start = end + SEPARATOR.length
    }
    writeCache(cache)
    done += batch.length
    onProgress?.(done)
  }
  return texts.map((text) => cache[keyOf(text)] ?? [])
}
