import { describe, expect, it } from 'vitest'
import { extractPromoters } from './promoters'

describe('extractPromoters', () => {
  it('pega @perfis e links do Instagram, sem repetir, na ordem', () => {
    const html =
      'Noite com @Tropicavana.Bar e DJ @djay.marto.<br>Mais: <a href="https://www.instagram.com/tropicavana_bar/">insta</a> e @tropicavana.bar'
    expect(extractPromoters(html).handles).toEqual(['tropicavana.bar', 'djay.marto', 'tropicavana_bar'])
  })

  it('ignora e-mails e links de post/reel', () => {
    const html = 'Info: geral@escola.pt — https://www.instagram.com/p/ABC123/ e https://instagram.com/reel/XYZ'
    expect(extractPromoters(html).handles).toEqual([])
  })

  it.each([
    ['👥 Organization: WCS Portugal', 'WCS Portugal'],
    ['A community event organised by Portugal Social Events & International Friends Lisbon.', 'Portugal Social Events & International Friends Lisbon'],
    ['🤝 Com o apoio da Junta e organização da Animatudo Eventos.', 'Animatudo Eventos'],
    ['Organizado pela Embaixada da República Dominicana', 'Embaixada da República Dominicana'],
  ])('organização: %s', (text, organizedBy) => {
    expect(extractPromoters(text).organizedBy).toBe(organizedBy)
  })

  it('sem descrição', () => {
    expect(extractPromoters(undefined)).toEqual({ handles: [] })
  })
})
