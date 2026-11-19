import { describe, expect, it } from 'vitest'
import type { DanceEvent } from '../../domain/event'
import { detectChanges, snapshotOf } from './changes'

const base: DanceEvent = {
  id: 'a',
  slug: 'a',
  title: 'Samba no Mercado',
  genres: ['Samba'],
  rawTag: 'Samba',
  start: new Date('2026-11-17T20:00:00Z'),
  end: new Date('2026-11-17T23:45:00Z'),
  allDay: false,
  venue: { location: 'Time Out Market Lisboa, Av. 24 de Julho 49', name: 'Time Out Market Lisboa', address: '' },
  links: [],
  calendarUrl: '',
  source: 'pasdedeux',
}
const dayOf = (iso: string) => iso.slice(0, 10)
const loaded = [{ start: '2026-11-17', end: '2026-12-01' }]

describe('detectChanges', () => {
  it('sem mudança, nada a avisar', () => {
    expect(detectChanges([snapshotOf(base)], [base], loaded, dayOf)).toEqual([])
  })

  it('horário, local e situação', () => {
    const now = {
      ...base,
      start: new Date('2026-11-17T21:00:00Z'),
      status: 'cancelled' as const,
      venue: { ...base.venue!, location: 'Outro lugar' },
    }
    const [change] = detectChanges([snapshotOf(base)], [now], loaded, dayOf)
    expect(change).toMatchObject({ kind: 'changed', fields: ['time', 'location', 'status'], title: 'Samba no Mercado' })
    expect(change.after?.status).toBe('cancelled')
  })

  it('removido: dia dentro de uma janela carregada e evento ausente', () => {
    expect(detectChanges([snapshotOf(base)], [], loaded, dayOf)).toMatchObject([{ kind: 'removed', id: 'a' }])
  })

  it('fora das janelas carregadas não dá para saber: nada a avisar', () => {
    expect(detectChanges([snapshotOf(base)], [], [{ start: '2026-12-01', end: '2026-12-15' }], dayOf)).toEqual([])
  })
})
