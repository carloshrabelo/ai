import { describe, expect, it } from 'vitest'
import { detectPlatform, navigationLink } from './navigationLink'

const venue = { name: 'Mirage Lounge', address: 'R. Heróis de Chaimite 31, Odivelas', lat: 38.79, lng: -9.18 }
const noCoords = { name: 'Lugar Novo', address: 'Rua X, Lisboa' }

describe('detectPlatform', () => {
  it.each([
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120', 0, 'android'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5, 'ios'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari', 5, 'ios'], // iPadOS
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome', 0, 'other'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome', 0, 'other'],
  ])('%s → %s', (userAgent, maxTouchPoints, expected) => {
    expect(detectPlatform({ userAgent, maxTouchPoints })).toBe(expected)
  })
})

describe('navigationLink', () => {
  it('Android: geo: com coordenadas e nome (abre o seletor de apps)', () => {
    expect(navigationLink(venue, 'android')).toEqual({
      href: 'geo:38.79,-9.18?q=38.79%2C-9.18(Mirage%20Lounge)',
      external: false,
    })
  })

  it('iOS: Apple Maps com rota', () => {
    const { href, external } = navigationLink(venue, 'ios')
    expect(external).toBe(true)
    expect(new URL(href).searchParams.get('daddr')).toBe('38.79,-9.18')
  })

  it('outros: rota no Google Maps', () => {
    const { href } = navigationLink(venue, 'other')
    const url = new URL(href)
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/')
    expect(url.searchParams.get('destination')).toBe('38.79,-9.18')
  })

  it('sem coordenadas: usa nome e endereço', () => {
    expect(new URL(navigationLink(noCoords, 'other').href).searchParams.get('destination')).toBe('Lugar Novo, Rua X, Lisboa')
    expect(navigationLink(noCoords, 'android').href).toBe('geo:0,0?q=Lugar%20Novo%2C%20Rua%20X%2C%20Lisboa')
  })
})
