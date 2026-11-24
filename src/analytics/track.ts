/**
 * Rastreamento de cliques por atributos no DOM, pronto para uma ferramenta de analytics.
 *
 * Convenção: todo elemento clicável relevante tem `data-track="<área>.<ação>"` (nome fixo, deste
 * catálogo) e, quando a ação depende de um valor, `data-track-value` (dia, slug do evento, gênero,
 * rota…). A página onde o clique aconteceu vem de `location.pathname`, então o mesmo nome serve na
 * agenda e no mapa (ex.: `event.open` na lista e no carrossel).
 *
 * Para ligar uma ferramenta, um listener só, delegado no document (ver `onTrackedClick`):
 *
 *   onTrackedClick(({ id, value, path }) => analytics.track(id, { value, path }))
 *
 * Ferramentas que leem atributos direto (Plausible com "tagged events", GTM com gatilho de clique por
 * atributo, PostHog autocapture com `data-*`) podem usar `data-track` sem código.
 */
export type TrackId =
  // Navegação (menu inferior, sidebar, logo). value: rota
  | 'nav.link'
  // Datas
  | 'dates.shortcut' // value: yesterday | today | tomorrow
  | 'dates.other-date'
  | 'dates.strip-day' // value: YYYY-MM-DD
  | 'dates.calendar-open'
  | 'dates.calendar-previous-month'
  | 'dates.calendar-next-month'
  | 'dates.calendar-day' // value: YYYY-MM-DD
  // Filtros
  | 'filters.open'
  | 'filters.group' // value: Latinas | Afro | BR | other-styles
  | 'filters.genre' // value: gênero
  | 'filters.clear'
  | 'filters.done'
  | 'filters.close'
  // Eventos
  | 'event.open' // value: slug
  | 'event.card-add-to-calendar' // value: slug
  | 'event.add-to-calendar' // value: slug (abre as opções nos detalhes)
  | 'event.add-google' // value: slug
  | 'event.add-ics' // value: slug
  | 'event.share' // value: slug
  | 'event.open-in-maps' // value: slug
  | 'event.untrack' // value: slug
  | 'event.close'
  | 'event.change-view' // value: slug (aviso de mudança)
  | 'event.change-ok' // value: slug
  // Mapa
  | 'map.pin' // value: nome do local
  | 'map.cluster' // value: total de eventos
  | 'map.fit'
  | 'map.outside'
  // Localização
  | 'location.request'
  // Comunidade
  | 'community.link' // value: URL
  | 'community.view-calendar' // value: id do calendário
  | 'community.subscribe-google' // value: id do calendário
  | 'community.subscribe-apple' // value: id do calendário
  | 'community.copy-ics' // value: id do calendário
  // Configurações e PWA
  | 'settings.theme' // value: light | dark | system
  | 'settings.language' // value: auto | pt-BR | en-US
  | 'pwa.install'
  | 'pwa.install-dismiss'
  | 'pwa.offline-close'
  | 'about.link' // value: URL

/** Atributos de rastreamento para espalhar num elemento: `<button {...track('filters.open')}>`. */
export function track(id: TrackId, value?: string | number) {
  return value === undefined ? { 'data-track': id } : { 'data-track': id, 'data-track-value': String(value) }
}

export type TrackedClick = { id: TrackId; value?: string; path: string }

/**
 * Chama `send` a cada clique num elemento com `data-track` (ou dentro dele). Fase de captura: pega
 * também cliques que componentes param a propagação (popovers, mapa). Devolve a função que desliga.
 */
export function onTrackedClick(send: (click: TrackedClick) => void): () => void {
  const listener = (event: MouseEvent) => {
    const element = (event.target as Element | null)?.closest?.<HTMLElement>('[data-track]')
    if (!element) return
    send({ id: element.dataset.track as TrackId, value: element.dataset.trackValue, path: window.location.pathname })
  }
  document.addEventListener('click', listener, true)
  return () => document.removeEventListener('click', listener, true)
}
