import { describe, expect, it } from 'vitest'
import { extractPromoters, roleOf } from './promoters'

const handles = (html: string) => extractPromoters(html).mentions.map((mention) => mention.handle)

describe('extractPromoters', () => {
  it('pega @perfis e links do Instagram, sem repetir, na ordem', () => {
    const html =
      'Noite com @Tropicavana.Bar e DJ @djay.marto.<br>Mais: <a href="https://www.instagram.com/tropicavana_bar/">insta</a> e @tropicavana.bar'
    expect(handles(html)).toEqual(['tropicavana.bar', 'djay.marto', 'tropicavana_bar'])
  })

  it('ignora e-mails e links de post/reel', () => {
    const html = 'Info: geral@escola.pt — https://www.instagram.com/p/ABC123/ e https://instagram.com/reel/XYZ'
    expect(handles(html)).toEqual([])
  })

  it('papel de cada menção pelo contexto (exemplos reais)', () => {
    const html = [
      'Only Cuban arrives at @copoalto',
      '10:30–11:30 | Partner Work — Fernanda Parra @la.ferp4rra',
      '🎧 DJ Dani Bahamondes @dani.bahamondes_ from Chile',
      'Workshop de TIMBA A PAR com @dcasty e @orobertoval',
      '🌅 Venue - Open-air terrace in @oliva_lisboa',
      'DJs: ⚫ Djay Marto | @djay.marto 🟡 DJ r1do | @djr1do',
      'Envia DM para: @dancersclub.lx @carlarendall',
      'Mais info: @only.cubancl @dalemamboeuropa',
    ].join('<br>')
    expect(extractPromoters(html).mentions).toEqual([
      { handle: 'copoalto', role: 'venue' },
      { handle: 'la.ferp4rra', role: 'teacher' },
      { handle: 'dani.bahamondes_', role: 'dj' },
      { handle: 'dcasty', role: 'teacher' },
      { handle: 'orobertoval', role: 'teacher' },
      { handle: 'oliva_lisboa', role: 'venue' },
      { handle: 'djay.marto', role: 'dj' },
      { handle: 'djr1do', role: 'dj' },
      { handle: 'dancersclub.lx', role: 'other' },
      { handle: 'carlarendall', role: 'other' },
      { handle: 'only.cubancl', role: 'promoter' },
      { handle: 'dalemamboeuropa', role: 'promoter' },
    ])
  })

  it('bloco "Mais info:" com um @ por linha (formato do calendário)', () => {
    const text = 'Mais info: \n@salsaconsol\n@almacalena.lisboa\n\nTuas as doações… com @outro.perfil'
    expect(extractPromoters(text).mentions).toEqual([
      { handle: 'salsaconsol', role: 'promoter' },
      { handle: 'almacalena.lisboa', role: 'promoter' },
      { handle: 'outro.perfil', role: 'other' },
    ])
  })

  it('bloco "Mais info:" com linha em branco e link de perfil', () => {
    const text = 'Mais info: \n\nhttps://www.instagram.com/miragelounge.odivelas/?hl=en\n\n✅️ Kizomba Team no @mirage.x'
    expect(extractPromoters(text).mentions).toEqual([
      { handle: 'miragelounge.odivelas', role: 'promoter' },
      { handle: 'mirage.x', role: 'venue' },
    ])
  })

  it('texto logo depois de "Mais info:" encerra o bloco', () => {
    const text = 'Mais info: \n\nHello! Come to our workshop with @teacher.x'
    expect(extractPromoters(text).mentions).toEqual([{ handle: 'teacher.x', role: 'teacher' }])
  })

  it('lista de @ um por linha herda o papel da linha de cima', () => {
    const text = 'DJs convidados a garantir o melhor ambiente\n@djmacalak\n@diogopto\n@paulofilipe77\n\nObrigado @casa.x'
    expect(extractPromoters(text).mentions.map((mention) => mention.role)).toEqual(['dj', 'dj', 'dj', 'other'])
  })

  it('@ na mesma linha, abaixo da dica (exemplo real)', () => {
    const text = '🎧 DJs convidados a garantir o melhor ambiente\n@djmacalak @diogopto @paulofilipe77\n🍹 Pista'
    expect(extractPromoters(text).mentions.map((mention) => mention.role)).toEqual(['dj', 'dj', 'dj'])
  })

  it('"Mais info" vence outro papel no mesmo evento', () => {
    const html = 'Festa com DJ @dj.x<br>Mais info: @dj.x'
    expect(extractPromoters(html).mentions).toEqual([{ handle: 'dj.x', role: 'promoter' }])
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
    expect(extractPromoters(undefined)).toEqual({ mentions: [] })
  })
})

describe('roleOf', () => {
  it.each([
    ['x', 'More info: ', 'promoter'],
    ['x', '+ Info: ', 'promoter'],
    ['djmacalak', 'DJs convidados a garantir o melhor ambiente ', 'dj'],
    ['paulofilipe77', 'DJs convidados a garantir o melhor ambiente @djmacalak @diogopto ', 'dj'],
    ['x', 'Where: ', 'venue'],
    ['x', 'junto ao ', 'venue'],
    ['x', '💃 09:30–10:30 | Foundations — Sofi Sartori ', 'teacher'],
    ['x', '❤️ This event is also a special farewell for ', 'other'],
  ] as const)('%s / %s', (handle, before, role) => {
    expect(roleOf(handle, before)).toBe(role)
  })
})
