import { describe, expect, it } from 'vitest'
import type { GCalEvent } from '../data/googleCalendar'
import { fromTangoLx, fromTradicionais, parseTimeRange } from './calendarSources'
import { toDanceEvent } from './event'

const base = (over: Partial<GCalEvent>): GCalEvent => ({
  id: 'x1',
  status: 'confirmed',
  htmlLink: 'https://www.google.com/calendar/event?eid=x',
  start: { date: '2026-11-18' },
  end: { date: '2026-11-19' },
  ...over,
})

describe('fromTangoLx', () => {
  const milonga = base({
    summary: 'Milonga Tango na Rua',
    description:
      'Time: 20h00-22:30  <br>Where: LAGAR S. VICENTE -  <a href="https://maps.app.goo.gl/x"><u>R. Prof. Francisco Gentil 33, 1600-622 Lisboa </u></a><br>Entrance: Free<br>DJ: Dani Benson<br><a href="https://tangonarua.wixsite.com">More info...</a>',
  })

  it('hora, local e entrada da descrição; tag Tango', () => {
    const event = fromTangoLx(milonga)
    expect(event.summary).toBe('Tango • Milonga Tango na Rua • Free')
    expect(event.location).toBe('LAGAR S. VICENTE, R. Prof. Francisco Gentil 33, 1600-622 Lisboa')
    // Novembro: Lisboa = UTC.
    expect(event.start).toEqual({ dateTime: '2026-11-18T20:00:00.000Z', timeZone: 'Europe/Lisbon' })
    expect(event.end).toEqual({ dateTime: '2026-11-18T22:30:00.000Z', timeZone: 'Europe/Lisbon' })
  })

  it('vira um evento do app com gênero, preço, local e hora', () => {
    const event = toDanceEvent(fromTangoLx(milonga))
    expect(event).toMatchObject({ title: 'Milonga Tango na Rua', genres: ['Tango'], price: 'Free', allDay: false })
    expect(event.venue?.name).toBe('LAGAR S. VICENTE')
  })

  it('termina depois da meia-noite: dia seguinte', () => {
    const event = fromTangoLx(base({ summary: "Milonga d'Avenida", description: 'Time: 21h00-01:00<br>Entrance: 8€' }))
    expect(event.end.dateTime).toBe('2026-11-19T01:00:00.000Z')
    expect(event.summary).toBe("Tango • Milonga d'Avenida • 8€")
  })

  it('travessões no local; entrada vazia não vai para o título; sem hora fica dia inteiro', () => {
    const event = fromTangoLx(
      base({ summary: '(Cancelado) Milonga X', description: '<p>Where: Teatro A Barraca—Bar A Barraca—Largo de Santos, 2, Lisboa<br>Entrance: <br>DJ:</p>' }),
    )
    expect(event.summary).toBe('(Cancelado) Tango • Milonga X')
    expect(event.location).toBe('Teatro A Barraca, Bar A Barraca, Largo de Santos, 2, Lisboa')
    expect(event.start).toEqual({ date: '2026-11-18' })
  })

  it('" - " no nome do local fica ("BUS - Paragem Cultural")', () => {
    const event = fromTangoLx(base({ summary: 'La Orillera', description: 'Where: BUS - Paragem Cultural,  R. Maria 73, 1170-133 Lisboa, Portugal' }))
    expect(event.location).toBe('BUS - Paragem Cultural, R. Maria 73, 1170-133 Lisboa, Portugal')
  })

  it.each([
    ['20h00-22:30', { start: 1200, end: 1350 }],
    ['21h00-00h:00', { start: 1260, end: 1440 }],
    ['19h00-21h30', { start: 1140, end: 1290 }],
    ['21h00-00h50', { start: 1260, end: 1490 }],
    ['sem hora', undefined],
  ])('parseTimeRange(%s)', (text, expected) => {
    expect(parseTimeRange(text)).toEqual(expected)
  })
})

describe('fromTradicionais', () => {
  it('"Nome | Cidade": tag Tradicionais e a cidade junto do local', () => {
    const event = fromTradicionais(base({ summary: 'BALL-Trad: TRIOBLIQUE (fr/it) | Lisboa', location: 'Teatro da Luz' }))
    expect(event.summary).toBe('Tradicionais • BALL-Trad: TRIOBLIQUE (fr/it)')
    expect(event.location).toBe('Teatro da Luz, Lisboa')
    expect(toDanceEvent(event)).toMatchObject({ title: 'BALL-Trad: TRIOBLIQUE (fr/it)', genres: ['Tradicionais'] })
  })

  it('cidade já no local não repete; "Nome | Data | CIDADE" usa o último trecho', () => {
    expect(fromTradicionais(base({ summary: 'Tertúlia Folk | Porto', location: 'A Beneficência Familiar - ASM do Porto' })).location).toBe(
      'A Beneficência Familiar - ASM do Porto',
    )
    const omatrad = fromTradicionais(base({ summary: 'OMATRAD FOLK | 22 NOVEMBR0 | AVEIRO', location: 'OMA - Oficina de Música de Aveiro' }))
    expect(omatrad.summary).toBe('Tradicionais • OMATRAD FOLK')
    expect(omatrad.location).toBe('OMA - Oficina de Música de Aveiro')
  })

  it('sem local: a cidade vira o local', () => {
    expect(fromTradicionais(base({ summary: 'Desdobra-te | Évora' })).location).toBe('Évora')
  })
})
