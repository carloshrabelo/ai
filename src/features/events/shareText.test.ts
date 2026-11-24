import { describe, expect, it } from 'vitest'
import type { DanceEvent } from '../../domain/event'
import { shareText } from './shareText'

const url = 'https://example.com/event/noite-de-salsa/'
const event = {
  title: 'Noite de Salsa',
  allDay: false,
  start: new Date('2026-07-03T19:30:00Z'), // 20:30 em Lisboa
  end: new Date('2026-07-03T23:00:00Z'),
  venue: { location: 'Bar X, Rua Y 1', name: 'Bar X', address: 'Rua Y 1' },
} as DanceEvent
const morningOf = new Date('2026-07-03T09:00:00Z')
const dayBefore = new Date('2026-07-02T09:00:00Z')

describe('shareText', () => {
  it('hoje, com hora e local', () => {
    expect(shareText(event, url, 'pt-BR', morningOf)).toBe(`❤️ A dança é ainda melhor quando partilhada!

*Noite de Salsa*

📅 Hoje das 20:30 às 00:00
📍 Bar X

🎶 Boa música, novas conexões e muitos passos de dança!

👉 Descobre os detalhes:
${url}`)
  })

  it('outro dia', () => {
    expect(shareText(event, url, 'pt-BR', dayBefore)).toContain('\n📅 Dia 03/07 das 20:30 às 00:00\n')
  })

  it('já começou: agora, até o fim', () => {
    expect(shareText(event, url, 'pt-BR', new Date('2026-07-03T20:00:00Z'))).toContain('\n📅 Hoje, agora até 00:00\n')
  })

  it('que passa da meia-noite continua sendo da mesma noite', () => {
    const late = { ...event, start: new Date('2026-07-03T21:00:00Z'), end: new Date('2026-07-04T02:00:00Z') }
    expect(shareText(late, url, 'pt-BR', morningOf)).toContain('\n📅 Hoje das 22:00 às 03:00\n')
  })

  it('aberto de madrugada (antes das 05:00): o evento da noite anterior ainda é "Hoje"', () => {
    // Evento de 03/07, 22:00 às 23:30 em Lisboa; aberto em 04/07 à 01:00 em Lisboa (00:00 UTC).
    const earlier = { ...event, start: new Date('2026-07-03T21:00:00Z'), end: new Date('2026-07-03T22:30:00Z') }
    expect(shareText(earlier, url, 'pt-BR', new Date('2026-07-04T00:00:00Z'))).toContain('\n📅 Hoje das 22:00 às 23:30\n')
  })

  it('com horário e mais de um dia (festival): data e hora de início e de fim', () => {
    const festival = { ...event, start: new Date('2026-07-30T19:00:00Z'), end: new Date('2026-08-02T17:00:00Z') }
    expect(shareText(festival, url, 'pt-BR', dayBefore)).toContain('\n📅 De 30/07 às 20:00 a 02/08 às 18:00\n')
  })

  it('sem local, a linha do 📍 some', () => {
    const text = shareText({ ...event, venue: undefined }, url, 'pt-BR', dayBefore)
    expect(text).toContain('📅 Dia 03/07 das 20:30 às 00:00\n\n🎶')
    expect(text).not.toContain('📍')
  })

  it('dia inteiro: um dia ou intervalo', () => {
    const oneDay = { ...event, allDay: true, start: new Date('2026-07-29T23:00:00Z'), end: new Date('2026-07-30T23:00:00Z') }
    expect(shareText(oneDay, url, 'pt-BR', dayBefore)).toContain('\n📅 Dia 30/07\n')
    const festival = { ...oneDay, end: new Date('2026-08-02T23:00:00Z') }
    expect(shareText(festival, url, 'pt-BR', dayBefore)).toContain('\n📅 De 30/07 a 02/08\n')
  })

  it('inglês', () => {
    expect(shareText(event, url, 'en-US', morningOf)).toBe(`❤️ Dancing is even better when shared!

*Noite de Salsa*

📅 Today from 8:30 PM to 12:00 AM
📍 Bar X

🎶 Great music, new connections and lots of dance moves!

👉 See the details:
${url}`)
  })
})
