import type { CalendarSource } from './calendarSources'

// Evento como vem da Google Calendar API v3 (só os campos usados). A busca fica em
// src/api/googleCalendar.ts; o domínio só conhece o formato.

/** Início/fim de um evento: `date` para dia inteiro, `dateTime` para evento com hora. */
export type GCalDateTime = { date?: string; dateTime?: string; timeZone?: string }

/** Campos do evento da Google Calendar API v3 que o app usa. */
export type GCalEvent = {
  id: string
  status: string
  htmlLink: string
  summary?: string
  description?: string
  location?: string
  start: GCalDateTime
  end: GCalDateTime
  recurringEventId?: string
  /** Calendário de origem: preenchido pelo app depois da busca (não vem da API). Sem ele, o principal. */
  source?: CalendarSource
}
