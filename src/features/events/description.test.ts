// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { friendlyLinkText, renderDescription } from './description'

const labels = { instagramPost: 'Ver no Instagram' }
const render = (raw: string) => renderDescription(raw, labels)
const anchors = (html: string) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return [...div.querySelectorAll('a')].map((a) => ({ text: a.textContent, href: a.getAttribute('href') }))
}

describe('renderDescription', () => {
  it('texto puro: quebras de linha viram <br> e URLs viram links curtos em nova aba', () => {
    const html = render('Mais info:\nhttps://linktr.ee/lisbonwestiefest.')
    expect(html).toBe(
      'Mais info:<br><a href="https://linktr.ee/lisbonwestiefest" target="_blank" rel="noopener noreferrer" title="https://linktr.ee/lisbonwestiefest">linktr.ee/lisbonwestiefest</a>.',
    )
  })

  it('caso do print: @perfis viram links e a publicação do Instagram vira "Ver no Instagram"', () => {
    const html = render(
      'Mais info:\n@dance.com.gabriel\n@sambadegafieiralisboa\n\nhttps://www.instagram.com/p/DayCYMcIx2g/?igsh=MW9qZnd2emN0bm1rZQ==',
    )
    expect(anchors(html)).toEqual([
      { text: '@dance.com.gabriel', href: 'https://www.instagram.com/dance.com.gabriel/' },
      { text: '@sambadegafieiralisboa', href: 'https://www.instagram.com/sambadegafieiralisboa/' },
      { text: 'Ver no Instagram', href: 'https://www.instagram.com/p/DayCYMcIx2g/?igsh=MW9qZnd2emN0bm1rZQ==' },
    ])
  })

  it('e-mail não vira perfil; ponto final não entra no @', () => {
    expect(anchors(render('Contato: tropicodedanca@gmail.com'))).toEqual([])
    expect(anchors(render('Siga @lisbonwestiefest.'))).toEqual([
      { text: '@lisbonwestiefest', href: 'https://www.instagram.com/lisbonwestiefest/' },
    ])
  })

  it('remove scripts, handlers e javascript:', () => {
    const html = render('<p onclick="x()">oi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>')
    expect(html).not.toMatch(/script|onclick|javascript:/)
    expect(html).toContain('<p>oi</p>')
  })

  it('não duplica links que já são <a>; link com texto próprio mantém o texto', () => {
    const html = render('<a href="https://a.com">Bilhetes</a>')
    expect(anchors(html)).toEqual([{ text: 'Bilhetes', href: 'https://a.com' }])
    expect(html).toContain('target="_blank"')
  })

  it('mantém entidades como texto', () => {
    expect(render('GO&amp;DANCE')).toBe('GO&amp;DANCE')
  })
})

describe('friendlyLinkText', () => {
  it.each([
    ['https://www.instagram.com/p/DayCYMcIx2g/?igsh=xyz', 'Ver no Instagram'],
    ['https://www.instagram.com/reel/abc/', 'Ver no Instagram'],
    ['https://www.instagram.com/freedomdance.events/', '@freedomdance.events'],
    ['https://linktr.ee/lisbonwestiefest', 'linktr.ee/lisbonwestiefest'],
    ['https://www.goandance.com/en/event/8574/tropical-oporto-dance-congress', 'goandance.com/…'],
    ['https://pasdedeux.pt/', 'pasdedeux.pt'],
  ])('%s → %s', (href, expected) => {
    expect(friendlyLinkText(href, labels)).toBe(expected)
  })
})
