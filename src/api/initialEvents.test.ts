// @vitest-environment jsdom
import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'
import type { GCalEvent } from '../domain/gcal'
import { initialEventsScript, seedInitialEvents } from './initialEvents'

const item: GCalEvent = {
  id: 'e1',
  status: 'confirmed',
  htmlLink: '',
  summary: 'Salsa • </script><b>Noite</b> • 5€',
  start: { dateTime: '2026-11-26T19:00:00Z' },
  end: { dateTime: '2026-11-26T23:00:00Z' },
  source: 'pasdedeux',
}
const data = { generatedAt: '2026-11-24T05:00:00Z', page: { start: '2026-11-24', end: '2026-12-08', items: [item] } }

/** Põe o <script> no documento, como o prerender faz no index.html. */
function embed(html = initialEventsScript(data)) {
  document.head.insertAdjacentHTML('beforeend', html)
}
const key = ['events', '2026-11-24']

afterEach(() => {
  document.head.innerHTML = ''
})

describe('initialEvents', () => {
  it('o JSON não fecha a tag <script> no meio (texto do evento com </script>)', () => {
    const html = initialEventsScript(data)
    expect(html.match(/<\/script>/g)).toHaveLength(1)
    embed(html)
    expect(document.getElementById('initial-events')).not.toBeNull()
  })

  it('primeira janela do mesmo dia: entra na query com a data do build, e o <script> sai do documento', () => {
    embed()
    const client = new QueryClient()
    seedInitialEvents(client, '2026-11-24')
    expect(client.getQueryData(key)).toEqual({ pages: [data.page], pageParams: ['2026-11-24'] })
    expect(client.getQueryState(key)?.dataUpdatedAt).toBe(Date.parse(data.generatedAt))
    expect(document.getElementById('initial-events')).toBeNull()
  })

  it('outro dia (HTML de ontem ou ?date=): não usa', () => {
    embed()
    const client = new QueryClient()
    seedInitialEvents(client, '2026-11-25')
    expect(client.getQueryData(['events', '2026-11-25'])).toBeUndefined()
  })

  it('query já com dados (ex.: cache do aparelho): não sobrescreve', () => {
    embed()
    const client = new QueryClient()
    const saved = { pages: [{ ...data.page, items: [] }], pageParams: ['2026-11-24'] }
    client.setQueryData(key, saved)
    seedInitialEvents(client, '2026-11-24')
    expect(client.getQueryData(key)).toBe(saved)
  })

  it('sem o <script> (dev, mock, outras páginas): nada muda', () => {
    const client = new QueryClient()
    seedInitialEvents(client, '2026-11-24')
    expect(client.getQueryData(key)).toBeUndefined()
  })
})
