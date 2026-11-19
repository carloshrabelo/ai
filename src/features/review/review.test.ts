import { describe, expect, it } from 'vitest'
import type { DanceEvent } from '../../domain/event'
import { buildReport, corrected, findIssues, groupEvents, type FieldIssue } from './review'

const event = (over: Partial<DanceEvent>): DanceEvent => ({
  id: 'e1',
  slug: 'e1',
  title: 'Noite Latina',
  genres: [],
  rawTag: '',
  start: new Date('2026-11-20T21:00:00Z'),
  end: new Date('2026-11-20T23:00:00Z'),
  allDay: false,
  links: [],
  calendarUrl: 'https://www.google.com/calendar/event?eid=e1',
  source: 'pasdedeux',
  ...over,
})

const description = 'Mais info:<br>@tropicavana.bar'
const weekly = [
  event({ id: 'a', description }),
  event({ id: 'b', description, start: new Date('2026-11-27T21:00:00Z'), end: new Date('2026-11-27T23:00:00Z') }),
  event({ id: 'c', title: 'Milonga', source: 'tangolx' }),
]
const first = (issue: FieldIssue) => issue.suggestions[0]

describe('review', () => {
  it('agrupa repetições pelo texto e filtra por calendário', () => {
    const groups = groupEvents(weekly, ['pasdedeux'])
    expect(groups).toHaveLength(1)
    expect(groups[0].events.map((item) => item.id)).toEqual(['a', 'b'])
    expect(groupEvents(weekly, ['pasdedeux', 'tangolx'])).toHaveLength(2)
  })

  it('acha o perfil escrito errado (aliases de promoters.json) e corrige no HTML', () => {
    const [reviewed] = findIssues(groupEvents(weekly, ['pasdedeux']), { aliases: true, ignored: new Set() })
    expect(reviewed.issues.map(({ word, suggestions }) => [word, suggestions[0]])).toEqual([['tropicavana.bar', 'tropicavana_bar']])
    expect(corrected(reviewed.group, reviewed.issues, first).description).toEqual({
      html: 'Mais info:<br>@tropicavana_bar',
      text: 'Mais info:\n@tropicavana_bar',
      changed: true,
    })
    // "Não corrigir": nada muda.
    expect(corrected(reviewed.group, reviewed.issues, () => null).description?.changed).toBe(false)
  })

  it('sem a verificação de perfis, nada a corrigir', () => {
    expect(findIssues(groupEvents(weekly, ['pasdedeux']), { aliases: false, ignored: new Set() })).toEqual([])
  })

  it('relatório com calendários, período, repetições, link e texto corrigido', () => {
    const reviewed = findIssues(groupEvents(weekly, ['pasdedeux']), { aliases: true, ignored: new Set() })
    const report = buildReport(reviewed, first, { calendars: ['Pas de Deux'], from: '2026-11-19', to: '2027-02-17' })
    expect(report).toContain('Revisão da agenda: Pas de Deux (19/11/2026 a 17/02/2027): 1 eventos com correções')
    expect(report).toContain('Noite Latina (repete: Sex, 27/11)')
    expect(report).toContain('Google Agenda: https://www.google.com/calendar/event?eid=e1')
    expect(report).toContain('Corrigir: @tropicavana.bar → @tropicavana_bar')
    expect(report).toContain('Descrição corrigida:\nMais info:\n@tropicavana_bar')
  })
})
