// Auditoria de acessibilidade (axe-core, WCAG 2.1 AA + boas práticas) nas telas principais,
// nos dois temas, celular e desktop.
//
// Uso: pnpm build && pnpm preview  (em outro terminal)  e depois  pnpm a11y [url]
// Padrão: http://localhost:4173. Usa o Chrome instalado (CHROME_PATH para outro caminho).
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
const base = (process.argv[2] ?? 'http://localhost:4173').replace(/\/$/, '')
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9600 + Math.floor(Math.random() * 100)
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--lang=pt-BR',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let target
for (let i = 0; i < 60 && !target; i++) {
  await sleep(250)
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page')
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
})
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id
    pending.set(i, r)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.result?.value
await send('Page.enable')
const scenarios = [
  { name: 'celular · lista · claro', url: '/', w: 390, h: 844 },
  { name: 'celular · lista · escuro', url: '/', w: 390, h: 844, dark: true },
  {
    name: 'celular · filtros abertos',
    url: '/',
    w: 390,
    h: 844,
    before: "document.querySelector('button[aria-controls][aria-expanded]').click()",
  },
  { name: 'celular · detalhes (drawer)', url: '/', w: 390, h: 844, before: "document.querySelectorAll('article h3 button')[1].click()" },
  { name: 'celular · mapa · claro', url: '/map', w: 390, h: 844 },
  { name: 'tablet · agenda · escuro', url: '/', w: 820, h: 1180, dark: true },
  { name: 'desktop · lista + mapa · claro', url: '/', w: 1440, h: 900 },
  {
    name: 'desktop · detalhes · escuro',
    url: '/',
    w: 1440,
    h: 900,
    dark: true,
    before: "document.querySelectorAll('article h3 button')[1].click()",
  },
  { name: 'desktop · info', url: '/about', w: 1440, h: 900 },
]
let total = 0
for (const s of scenarios) {
  await send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: 1, mobile: s.w < 768 })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: s.dark ? 'dark' : 'light' }] })
  await send('Page.navigate', { url: base + s.url })
  await sleep(5000)
  if (s.before) {
    await evaluate(s.before)
    await sleep(1500)
  }
  await evaluate(axeSource)
  const result = await evaluate(
    `axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }).then(r => r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, ex: v.nodes.slice(0, 3).map(n => n.target.join(' ') + (n.any[0]?.message ? ' — ' + n.any[0].message.slice(0, 120) : '')) })))`,
  )
  total += result.length
  console.log(`\n## ${s.name}: ${result.length} problema(s)`)
  for (const v of result) console.log(`- [${v.impact}] ${v.id} (${v.n}): ${v.help}\n    ${v.ex.join('\n    ')}`)
}
ws.close()
chrome.kill()
process.exit(total > 0 ? 1 : 0)
