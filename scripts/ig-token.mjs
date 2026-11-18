// Gera o token da Instagram Graph API (oficial) para buscar dados públicos de contas profissionais
// (Business Discovery: nome e foto de perfil) e grava no .env.local:
//   IG_ACCESS_TOKEN  token de usuário de longa duração (~60 dias; rode de novo para renovar)
//   IG_USER_ID       id da SUA conta profissional do Instagram (quem faz a consulta)
// Nada disso tem o prefixo VITE_: nunca vai para o app. Os valores não são impressos.
//
// Uma vez, no Meta:
//   1. Sua conta do Instagram precisa ser profissional (comercial ou criador) e estar ligada a uma
//      Página do Facebook (Instagram → Configurações → Tipo de conta e ferramentas; Página → Configurações → Contas vinculadas).
//   2. developers.facebook.com → Meus apps → Criar app → tipo "Empresa" (Business). Em Configurações →
//      Básico, copie o ID do app e a Chave secreta para o .env.local:
//        META_APP_ID=...
//        META_APP_SECRET=...
//   3. Ferramentas → Explorador da Graph API (developers.facebook.com/tools/explorer): escolha o app,
//      "Usuário" como token, adicione as permissões instagram_basic, pages_show_list,
//      pages_read_engagement e business_management, clique em "Generate Access Token" e autorize a
//      Página ligada ao Instagram. Copie o token (curto, vale ~1 hora).
//
// Depois: pnpm ig:token <token curto> [perfil para testar]
// (ou IG_SHORT_TOKEN=<token> pnpm ig:token, para o token não ficar no histórico do terminal)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = join(root, '.env.local')
const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION ?? 'v23.0'}`

const envText = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : ''
/** Valor do ambiente ou do .env.local (sem aspas). */
function env(name) {
  if (process.env[name]) return process.env[name].trim()
  const line = envText.split('\n').find((row) => row.startsWith(`${name}=`))
  return (line?.slice(name.length + 1) ?? '').trim().replace(/^["']|["']$/g, '')
}

/** Grava (ou troca) NOME=valor no .env.local, sem mexer nas outras linhas. */
function setEnv(values) {
  let text = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : ''
  for (const [name, value] of Object.entries(values)) {
    const line = `${name}=${value}`
    const pattern = new RegExp(`^${name}=.*$`, 'm')
    text = pattern.test(text) ? text.replace(pattern, line) : `${text.replace(/\n?$/, '\n')}${line}\n`
  }
  writeFileSync(ENV_FILE, text)
}

/** GET na Graph API; erro com a mensagem do Meta (sem o token). */
async function graph(path, params) {
  const url = new URL(`${GRAPH}/${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const response = await fetch(url)
  const body = await response.json()
  if (!response.ok || body.error) {
    const error = body.error ?? {}
    throw new Error(`${path}: ${error.message ?? response.status}${error.code ? ` (código ${error.code})` : ''}`)
  }
  return body
}

function fail(message) {
  console.error(`\n${message}`)
  process.exit(1)
}

const args = process.argv.slice(2)
const shortToken = env('IG_SHORT_TOKEN') || args[0]
const testHandle = (env('IG_SHORT_TOKEN') ? args[0] : args[1]) ?? 'instagram'
const appId = env('META_APP_ID')
const appSecret = env('META_APP_SECRET')

if (!appId || !appSecret) fail('Faltam META_APP_ID e META_APP_SECRET no .env.local (passo 2 no topo de scripts/ig-token.mjs).')
if (!shortToken) fail('Passe o token curto do Explorador da Graph API: pnpm ig:token <token> (passo 3 no topo do script).')

try {
  // 1. Token curto (~1 h) → longo (~60 dias).
  const long = await graph('oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  })
  const token = long.access_token
  const days = long.expires_in ? Math.round(long.expires_in / 86400) : 60
  console.log(`1. Token de longa duração: ok (vale ~${days} dias, até ${new Date(Date.now() + days * 86400_000).toLocaleDateString('pt-BR')}).`)

  // 2. Páginas do usuário e a conta do Instagram ligada a cada uma.
  const pages = await graph('me/accounts', { fields: 'name,instagram_business_account{id,username}', access_token: token })
  const linked = (pages.data ?? []).filter((page) => page.instagram_business_account)
  if (linked.length === 0) {
    fail(
      `2. Nenhuma Página com conta do Instagram ligada (${pages.data?.length ?? 0} páginas autorizadas).\n` +
        '   Ligue a conta profissional do Instagram a uma Página e, ao gerar o token, autorize essa Página.',
    )
  }
  const { id: igUserId, username } = linked[0].instagram_business_account
  console.log(`2. Conta do Instagram: @${username} (Página "${linked[0].name}")${linked.length > 1 ? `; ${linked.length - 1} outra(s) ignorada(s)` : ''}.`)

  setEnv({ IG_ACCESS_TOKEN: token, IG_USER_ID: igUserId })
  console.log('   IG_ACCESS_TOKEN e IG_USER_ID gravados no .env.local.')

  // 3. Teste: Business Discovery de um perfil (precisa ser conta profissional).
  const found = await graph(igUserId, {
    fields: `business_discovery.username(${testHandle}){username,name,profile_picture_url}`,
    access_token: token,
  })
  const profile = found.business_discovery
  console.log(`3. Teste com @${testHandle}: ok (${profile.name ?? 'sem nome'}${profile.profile_picture_url ? ', com foto' : ', sem foto'}).`)
  console.log('\nPronto. O token vale ~60 dias; para renovar, gere um token curto de novo e rode outra vez.')
} catch (error) {
  fail(
    `Erro: ${error.message}\n` +
      'Dicas: o token curto expira em ~1 h; confira as 4 permissões ao gerar; o perfil de teste precisa ser\n' +
      'conta profissional (Business Discovery não vê contas pessoais).',
  )
}
