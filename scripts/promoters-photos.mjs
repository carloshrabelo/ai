// Baixa a foto de perfil do Instagram de cada perfil de src/data/promoters.json para
// public/promoters/<perfil>.jpg e preenche `photo` (e `name`, se estiver vazio). Usa o endpoint
// interno web_profile_info, que só responde com login: precisa do cookie `sessionid` de uma conta
// (de preferência secundária) em IG_SESSIONID, no ambiente ou no .env.local.
//
// Não oficial e contra os termos do Instagram: rode só local (nunca na Action), devagar (um perfil a
// cada 5–10 s) e para no primeiro sinal de bloqueio. Perfis com "photo" preenchido ou `false` (sem
// foto, por pedido) são pulados; --force busca de novo os que já têm.
//
// Uso: pnpm promoters:photos [máximo de perfis] [--force]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = join(root, 'src/data/promoters.json')
const OUT_DIR = join(root, 'public/promoters')
const args = process.argv.slice(2)
const force = args.includes('--force')
const max = Number(args.find((arg) => /^\d+$/.test(arg)) ?? Infinity)

/** IG_SESSIONID do ambiente ou do .env.local (o valor nunca é impresso). */
function sessionId() {
  if (process.env.IG_SESSIONID) return process.env.IG_SESSIONID.trim()
  const envFile = join(root, '.env.local')
  if (!existsSync(envFile)) return ''
  const line = readFileSync(envFile, 'utf8')
    .split('\n')
    .find((row) => row.startsWith('IG_SESSIONID='))
  return (line?.slice('IG_SESSIONID='.length) ?? '').trim().replace(/^["']|["']$/g, '')
}

const SESSION = sessionId()
if (!SESSION) {
  console.error('IG_SESSIONID não encontrado (ambiente ou .env.local). Veja o comentário no topo de scripts/promoters-photos.mjs.')
  process.exit(1)
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const pause = () => sleep(5000 + Math.random() * 5000)

class Blocked extends Error {}

/** Dados do perfil, `null` se não existe, ou Blocked se o Instagram recusou (login, limite, checkpoint). */
async function profile(handle) {
  const response = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`, {
    headers: {
      'User-Agent': UA,
      Accept: '*/*',
      'X-IG-App-ID': '936619743392459',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `https://www.instagram.com/${handle}/`,
      Cookie: `sessionid=${SESSION}`,
    },
    redirect: 'manual',
  })
  const type = response.headers.get('content-type') ?? ''
  if (response.status === 404 && type.includes('json')) return null
  if (!response.ok || !type.includes('json')) throw new Blocked(`HTTP ${response.status} (${type.split(';')[0] || 'sem tipo'})`)
  const body = await response.json()
  if (body.status !== 'ok') throw new Blocked(body.message ?? JSON.stringify(body).slice(0, 120))
  return body.data?.user ?? null
}

async function download(url, file) {
  const response = await fetch(url, { headers: { 'User-Agent': UA } })
  const type = response.headers.get('content-type') ?? ''
  if (!response.ok || !type.startsWith('image/')) throw new Error(`foto: HTTP ${response.status} ${type}`)
  writeFileSync(file, Buffer.from(await response.arrayBuffer()))
}

const directory = JSON.parse(readFileSync(FILE, 'utf8'))
const save = () => writeFileSync(FILE, `${JSON.stringify(directory, null, 2)}\n`)
const pending = Object.keys(directory)
  .filter((handle) => directory[handle].photo !== false && (force || !directory[handle].photo))
  .slice(0, max)

mkdirSync(OUT_DIR, { recursive: true })
console.log(`${pending.length} perfis para buscar (${Object.keys(directory).length} no arquivo). Um a cada 5–10 s.`)

const result = { saved: 0, missing: [], noPhoto: [] }
try {
  for (const [index, handle] of pending.entries()) {
    if (index > 0) await pause()
    const user = await profile(handle)
    if (!user) {
      result.missing.push(handle)
      console.log(`  @${handle}: não encontrado`)
      continue
    }
    if (!user.profile_pic_url) {
      result.noPhoto.push(handle)
      console.log(`  @${handle}: sem foto no perfil`)
      continue
    }
    await download(user.profile_pic_url, join(OUT_DIR, `${handle}.jpg`))
    directory[handle].photo = `promoters/${handle}.jpg`
    if (!directory[handle].name && user.full_name?.trim()) directory[handle].name = user.full_name.trim()
    save()
    result.saved++
    console.log(`  @${handle}: ok${user.full_name ? ` (${user.full_name})` : ''}`)
  }
} catch (error) {
  if (!(error instanceof Blocked)) throw error
  console.error(`\nParado: o Instagram recusou (${error.message}). O cookie pode ter expirado ou a conta caiu em verificação;`)
  console.error('entre no instagram.com com ela, copie o sessionid de novo e espere um tempo antes de rodar outra vez.')
  process.exitCode = 2
}

console.log(
  `\n${result.saved} fotos salvas em public/promoters/.` +
    (result.missing.length ? ` Não encontrados: ${result.missing.map((h) => `@${h}`).join(', ')}.` : '') +
    (result.noPhoto.length ? ` Sem foto: ${result.noPhoto.map((h) => `@${h}`).join(', ')}.` : ''),
)
