import { describe, expect, it } from 'vitest'
import { distanceKm, formatDistance } from './distance'

const CAIS_DO_SODRE = { lat: 38.7059, lng: -9.1449 }
const ODIVELAS = { lat: 38.7913, lng: -9.1806 }

describe('distanceKm', () => {
  it('mesmo ponto = 0', () => {
    expect(distanceKm(CAIS_DO_SODRE, CAIS_DO_SODRE)).toBe(0)
  })

  it('Cais do Sodré → Odivelas ≈ 10 km', () => {
    expect(distanceKm(CAIS_DO_SODRE, ODIVELAS)).toBeCloseTo(10, 0)
  })

  it('é simétrica', () => {
    expect(distanceKm(CAIS_DO_SODRE, ODIVELAS)).toBeCloseTo(distanceKm(ODIVELAS, CAIS_DO_SODRE), 10)
  })
})

describe('formatDistance', () => {
  it.each([
    [0.004, '10 m', '10 m'],
    [0.347, '350 m', '350 m'],
    [1, '1,0 km', '1.0 km'],
    [8.14, '8,1 km', '8.1 km'],
    [42.4, '42 km', '42 km'],
  ])('%d km → pt-BR %s, en-US %s', (km, pt, en) => {
    expect(formatDistance(km, 'pt-BR')).toBe(pt)
    expect(formatDistance(km, 'en-US')).toBe(en)
  })
})
