import type { Genre } from './genres'

// O app tem duas agendas com o mesmo formato (lista, faixa de dias, mapa, detalhes):
//   dance:        danças sociais de Lisboa (/), sem os eventos de danças tradicionais
//   tradicionais: danças tradicionais europeias no país todo (/tradicionais)
// Cada evento pertence a uma delas pelo gênero.

export type Agenda = 'dance' | 'tradicionais'

/** Prefixo dos caminhos de cada agenda (sem o basename do deploy). */
export const AGENDA_BASE: Record<Agenda, string> = { dance: '', tradicionais: '/tradicionais' }

export const agendaOf = (genres: readonly Genre[]): Agenda => (genres.includes('Tradicionais') ? 'tradicionais' : 'dance')

/** Agenda da página atual pelo caminho (/tradicionais, /tradicionais/evento/… → tradicionais). */
export const agendaFromPath = (pathname: string): Agenda => (/^\/tradicionais(?:\/|$)/.test(pathname) ? 'tradicionais' : 'dance')

/** Caminho relativo da página do evento, como no build estático: "evento/x/" ou "tradicionais/evento/x/". */
export function eventPagePath(event: { slug: string; genres: readonly Genre[] }): string {
  return `${AGENDA_BASE[agendaOf(event.genres)].slice(1).replace(/.$/, '$&/')}evento/${encodeURIComponent(event.slug)}/`
}
