// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderDescription } from './description'

describe('renderDescription', () => {
  it('texto puro: quebras de linha viram <br> e URLs viram links em nova aba', () => {
    const html = renderDescription('Mais info:\nhttps://linktr.ee/lisbonwestiefest.')
    expect(html).toBe(
      'Mais info:<br><a href="https://linktr.ee/lisbonwestiefest" target="_blank" rel="noopener noreferrer">https://linktr.ee/lisbonwestiefest</a>.',
    )
  })

  it('remove scripts, handlers e javascript:', () => {
    const html = renderDescription('<p onclick="x()">oi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>')
    expect(html).not.toMatch(/script|onclick|javascript:/)
    expect(html).toContain('<p>oi</p>')
  })

  it('não duplica links que já são <a>', () => {
    const html = renderDescription('<a href="https://a.com">https://a.com</a>')
    expect(html.match(/<a /g)).toHaveLength(1)
    expect(html).toContain('target="_blank"')
  })

  it('mantém entidades como texto', () => {
    expect(renderDescription('GO&amp;DANCE')).toBe('GO&amp;DANCE')
  })
})
