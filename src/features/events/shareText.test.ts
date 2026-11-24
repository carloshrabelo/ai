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

📅 Hoje às 20:30
📍 Bar X

🎶 Boa música, novas conexões e muitos passos de dança!

👉 Descobre os detalhes:
${url}`)
  })

  it('outro dia', () => {
    expect(shareText(event, url, 'pt-BR', dayBefore)).toContain('\n📅 Dia 03/07 às 20:30\n')
  })

  it('já começou: agora', () => {
    expect(shareText(event, url, 'pt-BR', new Date('2026-07-03T20:00:00Z'))).toContain('\n📅 Hoje, agora\n')
  })

  it('sem local, a linha do 📍 some', () => {
    const text = shareText({ ...event, venue: undefined }, url, 'pt-BR', dayBefore)
    expect(text).toContain('📅 Dia 03/07 às 20:30\n\n🎶')
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

📅 Today at 8:30 PM
📍 Bar X

🎶 Great music, new connections and lots of dance moves!

👉 See the details:
${url}`)
  })
})
