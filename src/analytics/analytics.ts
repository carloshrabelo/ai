/**
 * Analytics com GoatCounter (https://www.goatcounter.com): sem cookies, sem IP guardado e sem
 * dados pessoais, então não precisa de banner de consentimento.
 *
 * Desligado até existir VITE_GOATCOUNTER_CODE (o código do site, ex.: "lisbonsocialdance" para
 * https://lisbonsocialdance.goatcounter.com). Em `pnpm dev` também fica desligado.
 */

type GoatCounter = {
  count: (vars: { path: string; title?: string; event?: boolean }) => void
}

declare global {
  interface Window {
    goatcounter?: GoatCounter & { no_onload?: boolean; allow_local?: boolean }
  }
}

const CODE = import.meta.env.VITE_GOATCOUNTER_CODE?.trim() ?? ''
const ENABLED = CODE !== '' && !import.meta.env.DEV && typeof window !== 'undefined'

/** Contagens feitas antes de o script terminar de carregar. */
const queue: Parameters<GoatCounter['count']>[0][] = []

function send(vars: Parameters<GoatCounter['count']>[0]) {
  if (!ENABLED) return
  if (window.goatcounter?.count) window.goatcounter.count(vars)
  else queue.push(vars)
}

/** Carrega o script do GoatCounter (uma vez). Chamado no início do app. */
export function initAnalytics() {
  if (!ENABLED || document.querySelector('script[data-goatcounter]')) return
  // SPA: as páginas vistas são contadas pelo app a cada troca de rota (no_onload).
  window.goatcounter = { ...window.goatcounter, no_onload: true } as Window['goatcounter']
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://gc.zgo.at/count.js'
  script.dataset.goatcounter = `https://${CODE}.goatcounter.com/count`
  script.addEventListener('load', () => {
    for (const vars of queue.splice(0)) window.goatcounter?.count(vars)
  })
  document.head.append(script)
}

/** Página vista. `path` sem domínio nem basename (ex.: "/info", "/evento"). */
export function trackPageview(path: string, title = document.title) {
  send({ path, title })
}

/**
 * Ação do usuário. Aparece no painel do GoatCounter como evento com o nome dado, por exemplo
 * "filtro/salsa", "evento-aberto/mapa", "calendario/ics".
 */
export function trackAction(name: string, title?: string) {
  send({ path: name, title: title ?? name, event: true })
}
