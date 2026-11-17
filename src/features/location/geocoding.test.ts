import { describe, expect, it, vi } from 'vitest'
import { geocodeLocation, parseNominatim, parsePhoton, queriesFor, sameRegion } from './geocoding'

describe('queriesFor', () => {
  it('local com endereço: texto completo, endereço, rua + código postal, rua sem número, nome + cidade', () => {
    expect(queriesFor('Bar Havana, de Armz 5, Doca Alcântara, 1350-353 Lisboa, Portugal')).toEqual([
      'Bar Havana, de Armz 5, Doca Alcântara, 1350-353 Lisboa, Portugal',
      'de Armz 5, Doca Alcântara, 1350-353 Lisboa, Portugal',
      'de Armz 5, 1350-353 Lisboa',
      'de Armz, Lisboa',
      'Bar Havana, Lisboa',
    ])
  })

  it('remove partes repetidas', () => {
    expect(queriesFor('R. Serpa Pinto 19, R. Serpa Pinto 19, 1200-443 Lisboa, Portugal')[0]).toBe(
      'R. Serpa Pinto 19, R. Serpa Pinto 19, 1200-443 Lisboa, Portugal',
    )
    expect(queriesFor('R. Serpa Pinto 19, R. Serpa Pinto 19, 1200-443 Lisboa, Portugal')).toContain('R. Serpa Pinto, Lisboa')
  })

  it('só o nome: nome + Portugal', () => {
    expect(queriesFor('Beira Mar Atlético Clube de Almada')).toEqual([
      'Beira Mar Atlético Clube de Almada',
      'Beira Mar Atlético Clube de Almada, Portugal',
    ])
  })
})

describe('sameRegion', () => {
  const location = 'Bar Havana, Doca Alcântara, 1350-353 Lisboa, Portugal'

  it('aceita a mesma região (13xx)', () => {
    expect(sameRegion(location, { postcode: '1300-120' })).toBe(true)
  })

  it('rejeita outra região (Algarve 84xx)', () => {
    expect(sameRegion(location, { postcode: '8400-500' })).toBe(false)
  })

  it('código só com 4 dígitos também conta', () => {
    expect(sameRegion('R. Serpa Pinto 19, 1200-443 Lisboa', { postcode: '1600' })).toBe(false)
  })

  it('sem código de um dos lados, aceita', () => {
    expect(sameRegion('Beira Mar Atlético Clube de Almada', { postcode: '2800-046' })).toBe(true)
    expect(sameRegion(location, {})).toBe(true)
  })
})

describe('parsers', () => {
  it('Nominatim: tira o código postal do texto', () => {
    expect(
      parseNominatim([
        { lat: '38.7059001', lon: '-9.1449', display_name: 'Mercado da Ribeira, 49, Avenida 24 de Julho, Lisboa, 1200-479, Portugal' },
      ]),
    ).toEqual([
      {
        lat: 38.7059,
        lng: -9.1449,
        label: 'Mercado da Ribeira, 49, Avenida 24 de Julho, Lisboa, 1200-479, Portugal',
        postcode: '1200-479',
        provider: 'nominatim',
      },
    ])
  })

  it('Photon: GeoJSON [lon, lat]', () => {
    expect(
      parsePhoton({
        features: [
          {
            geometry: { coordinates: [-9.1787849, 38.6996871] },
            properties: { name: 'Bar', street: 'Avenida de Brasília', housenumber: '5', postcode: '1350-353', city: 'Lisboa' },
          },
        ],
      }),
    ).toEqual([
      { lat: 38.699687, lng: -9.178785, label: 'Bar, Avenida de Brasília 5, 1350-353, Lisboa', postcode: '1350-353', provider: 'photon' },
    ])
  })
})

describe('geocodeLocation', () => {
  const photon = (features: unknown[]) => new Response(JSON.stringify({ features }))
  const feature = (lng: number, lat: number, postcode: string) => ({ geometry: { coordinates: [lng, lat] }, properties: { postcode } })

  it('pula resultado de outra região e devolve o primeiro válido', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(photon([feature(-8.4, 37.1, '8400-500')])) // 1ª consulta: Algarve → rejeita
      .mockResolvedValueOnce(photon([feature(-9.17, 38.7, '1350-120')])) // 2ª consulta: Lisboa → aceita
    const hit = await geocodeLocation('Bar Havana, Doca Alcântara, 1350-353 Lisboa, Portugal', { fetch: fetchMock })
    expect(hit).toMatchObject({ lat: 38.7, lng: -9.17, provider: 'photon' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('erro de rede: tenta as próximas consultas e devolve null se nada der certo', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    expect(await geocodeLocation('Lugar Novo', { fetch: fetchMock })).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2) // "Lugar Novo" e "Lugar Novo, Portugal"
  })
})
