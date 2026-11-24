/**
 * Analytics com GoatCounter (https://www.goatcounter.com): sem cookies, sem IP guardado e sem
 * dados pessoais, então não precisa de banner de consentimento.
 *
 * Desligado até existir VITE_GOATCOUNTER_CODE (o código do site, ex.: "lisbonsocialdance" para
 * https://lisbonsocialdance.goatcounter.com). Em `pnpm dev` também fica desligado.
 */

import { onTrackedClick } from './track'

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

/** Página vista. `path` sem domínio nem basename (ex.: "/about", "/event/<slug>/"). */
export function trackPageview(path: string, title = document.title) {
  send({ path, title })
}

/**
 * Ação do usuário. Aparece no painel do GoatCounter como evento com o nome dado; os cliques vêm dos
 * atributos `data-track` (ver connectTrackedClicks), ex.: "filters.genre/Salsa", "event.open/<slug>".
 */
function trackAction(name: string, title?: string) {
  send({ path: name, title: title ?? name, event: true })
}

/**
 * Manda para o GoatCounter cada clique em elemento com `data-track` (src/analytics/track.ts): o evento
 * é "<id>/<valor>" (ou só "<id>"), com a página do clique no título. Um listener só, no document.
 */
export function connectTrackedClicks() {
  if (!ENABLED) return
  onTrackedClick(({ id, value, path }) => trackAction(value ? `${id}/${value}` : id, path))
}
