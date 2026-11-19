import { describe, expect, it } from 'vitest'
import { htmlToText, levenshtein } from './text'

describe('htmlToText', () => {
  it('quebra linha em <br> e fim de parágrafo, tira tags e decodifica entidades', () => {
    expect(htmlToText('<p>Salsa &amp; <b>Bachata</b></p><p>Rua  X,&nbsp;1<br>Lisboa</p>')).toBe('Salsa & Bachata\nRua X, 1\nLisboa')
  })

  it('junta linhas em branco repetidas', () => {
    expect(htmlToText('a<br><br><br><br>b')).toBe('a\n\nb')
  })

  it('opções: links e letras estilizadas', () => {
    expect(htmlToText('Mais info: <a href="https://instagram.com/x">aqui</a>', { keepLinks: true })).toBe(
      'Mais info: https://instagram.com/x aqui',
    )
    expect(htmlToText('𝐅𝐨𝐥𝐤', { normalize: true })).toBe('Folk')
    expect(htmlToText(undefined)).toBe('')
  })
})

describe('levenshtein', () => {
  it.each([
    ['', '', 0],
    ['dale.events', 'dale.eventss', 1],
    ['comessa', 'começa', 2],
    ['kitten', 'sitting', 3],
  ])('%s → %s = %d', (a, b, d) => {
    expect(levenshtein(a, b)).toBe(d)
  })
})
