import { describe, expect, it } from 'vitest'
import { eventSlug, slugDate, slugify } from './slug'

describe('slugify', () => {
  it.each([
    ['Festa Mirage', 'festa-mirage'],
    ['Forró da Liberdade', 'forro-da-liberdade'],
    ['Street Jazz Concert " Tuba Skinny" & "The Invisible Tuba"', 'street-jazz-concert-tuba-skinny-the-invisible-tuba'],
    ["Cuban Salsa Party after Workshop's", 'cuban-salsa-party-after-workshop-s'],
    ['  ¡Olé!  ', 'ole'],
  ])('%j → %j', (text, expected) => {
    expect(slugify(text)).toBe(expected)
  })

  it('corta no limite sem deixar "-" no fim', () => {
    expect(slugify('a'.repeat(30) + ' ' + 'b'.repeat(40), 31)).toBe('a'.repeat(30))
  })
})

describe('eventSlug', () => {
  const event = {
    id: 'o9f2oseq6l1lnqggfcdhupv20o_20261119T170000Z',
    title: 'Tropicavana Dance Night',
    start: new Date('2026-11-19T17:00:00Z'),
  }

  it('dia de Lisboa + nome + hash curto', () => {
    expect(eventSlug(event)).toMatch(/^2026-11-19-tropicavana-dance-night-[a-z0-9]{4,5}$/)
  })

  it('estável e diferente para ids diferentes', () => {
    expect(eventSlug(event)).toBe(eventSlug({ ...event }))
    expect(eventSlug(event)).not.toBe(eventSlug({ ...event, id: 'outro' }))
  })

  it('usa o dia de Lisboa (23:30 UTC no verão já é o dia seguinte)', () => {
    expect(eventSlug({ ...event, start: new Date('2026-07-03T23:30:00Z') })).toMatch(/^2026-07-04-/)
  })

  it('título sem letras', () => {
    expect(eventSlug({ ...event, title: '!!!' })).toMatch(/^2026-11-19-evento-/)
  })
})

describe('slugDate', () => {
  it('lê o dia do começo do slug', () => {
    expect(slugDate('2026-11-19-tropicavana-dance-night-abcde')).toBe('2026-11-19')
    expect(slugDate('qualquer-coisa')).toBeUndefined()
  })
})
