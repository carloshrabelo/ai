import { describe, expect, it } from 'vitest'
import { aliasIssues, applyFixes, spellingIssues, toPlain, type ToolMatch } from './spelling'

const match = (text: string, word: string, ...values: string[]): ToolMatch => ({
  offset: text.indexOf(word),
  length: word.length,
  replacements: values.map((value) => ({ value })),
})

describe('toPlain', () => {
  it('tira o HTML e guarda a posição de cada caractere', () => {
    const source = 'A <b>aula</b> comessa<br>às 21h &amp; mais'
    const plain = toPlain(source)
    expect(plain.text).toBe('A aula comessa\nàs 21h & mais')
    const at = plain.text.indexOf('comessa')
    expect(source.slice(plain.spans[at][0], plain.spans[at + 6][1])).toBe('comessa')
  })
})

describe('spellingIssues', () => {
  const text = 'A aula comessa com @dj.marto no Tropicavana, wellcome! kizomba'
  const pt = [
    match(text, 'comessa', 'comesse', 'começa'),
    match(text, 'marto', 'farto'),
    match(text, 'Tropicavana', 'Copacabana'),
    match(text, 'wellcome', 'celulose'),
    match(text, 'kizomba', 'zomba'),
  ]
  const en = [match(text, 'comessa', 'comes'), match(text, 'Tropicavana'), match(text, 'wellcome', 'welcome'), match(text, 'kizomba')]

  it('só o que todas as línguas marcam, fora de @perfis, nomes sem sugestão parecida e termos de dança', () => {
    expect(spellingIssues(text, [pt, en])).toEqual([
      { kind: 'spelling', offset: text.indexOf('comessa'), length: 7, word: 'comessa', suggestions: ['comesse', 'começa', 'comes'] },
      { kind: 'spelling', offset: text.indexOf('wellcome'), length: 8, word: 'wellcome', suggestions: ['welcome'] },
    ])
  })

  it('palavra marcada só em uma língua não conta', () => {
    expect(spellingIssues('Free entry', [[match('Free entry', 'entry', 'entra')], []])).toEqual([])
  })
})

describe('aliasIssues', () => {
  it('@grafia e link do Instagram', () => {
    const text = 'Mais info: @Tropicavana.bar e https://instagram.com/tropicavana.bar/ (não @tropicavana_bar)'
    const issues = aliasIssues(text, new Map([['tropicavana.bar', 'tropicavana_bar']]))
    expect(issues.map(({ offset, word, suggestions }) => [text.slice(offset, offset + word.length), suggestions[0]])).toEqual([
      ['Tropicavana.bar', 'tropicavana_bar'],
      ['tropicavana.bar', 'tropicavana_bar'],
    ])
  })
})

describe('applyFixes', () => {
  it('corrige no original, mantendo o HTML', () => {
    const source = 'A <b>aula</b> comessa<br>Mais info: @tropicavana.bar'
    const plain = toPlain(source)
    const fixes = [
      { offset: plain.text.indexOf('comessa'), length: 7, value: 'começa' },
      { offset: plain.text.indexOf('tropicavana.bar'), length: 15, value: 'tropicavana_bar' },
    ]
    expect(applyFixes(source, plain, fixes)).toBe('A <b>aula</b> começa<br>Mais info: @tropicavana_bar')
  })
})

describe('spellingIssues: nomes próprios', () => {
  it('sugestão que parte a palavra ou só muda maiúsculas não vale para nome', () => {
    const text = 'Tropicavana e BreakPoint, com o Fogaraté Team'
    const pt = [match(text, 'Tropicavana', 'Tropicava-a'), match(text, 'BreakPoint', 'Breakpoint'), match(text, 'Fogaraté', 'Fogar até')]
    expect(spellingIssues(text, [pt])).toEqual([])
  })
})
