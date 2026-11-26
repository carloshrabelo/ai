import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GCalEvent } from '../domain/gcal'
import { type SwrPart, splitSwrParts, swrWindow } from './swrEvents'

vi.mock('./config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./config')>()),
  SWR_URL: 'https://example.test/swr/',
}))

const event = (id: string, start: string, end = start): GCalEvent => ({
  id,
  status: 'confirmed',
  htmlLink: '',
  summary: id,
  start: { dateTime: `${start}T20:00:00Z` },
  end: { dateTime: `${end}T23:00:00Z` },
})

const GENERATED = '2026-11-26T10:00:00Z'
const items = [
  event('ontem', '2026-11-25'),
  event('hoje', '2026-11-26'),
  event('festival', '2026-11-29', '2026-12-01'), // atravessa a virada do 1º para o 2º arquivo
  event('semana-2', '2026-12-04'),
  event('ultimo', '2026-12-09'),
  event('depois', '2026-12-10'), // fora: depois dos 15 dias
]
const parts = splitSwrParts(items, '2026-11-25', GENERATED)
const ids = (list: { items: GCalEvent[] }) => list.items.map((item) => item.id)

describe('splitSwrParts', () => {
  it('3 arquivos de 5 dias a partir de ontem; evento de vários dias entra em cada um que toca', () => {
    expect(parts.map(({ start, end }) => [start, end])).toEqual([
      ['2026-11-25', '2026-11-30'],
      ['2026-11-30', '2026-12-05'],
      ['2026-12-05', '2026-12-10'],
    ])
    expect(parts.map(ids)).toEqual([['ontem', 'hoje', 'festival'], ['festival', 'semana-2'], ['ultimo']])
  })
})

describe('swrWindow', () => {
  it('monta a janela de 14 dias a partir de hoje, sem repetidos e ordenada', () => {
    const page = swrWindow(parts, '2026-11-26', '2026-12-10')
    expect(page && ids(page)).toEqual(['hoje', 'festival', 'semana-2', 'ultimo'])
    expect(page?.generatedAt).toBe(GENERATED)
  })

  it('de madrugada (a agenda ainda em ontem) também cabe', () => {
    expect(swrWindow(parts, '2026-11-25', '2026-12-09')).toBeDefined()
  })

  it('não cobre a janela: fora do período, arquivo faltando ou de gerações diferentes', () => {
    expect(swrWindow(parts, '2026-11-27', '2026-12-11')).toBeUndefined()
    expect(swrWindow([parts[0]!, parts[2]!], '2026-11-26', '2026-12-10')).toBeUndefined()
    const older: SwrPart = { ...parts[1]!, generatedAt: '2026-11-26T08:00:00Z' }
    expect(swrWindow([parts[0]!, older, parts[2]!], '2026-11-26', '2026-12-10')).toBeUndefined()
  })
})

describe('seedSwrEvents', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  async function seed(client: QueryClient) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const index = Number(/(\d)\.json$/.exec(url)?.[1])
        return new Response(JSON.stringify(parts[index]))
      }),
    )
    const { seedSwrEvents } = await import('./swrEvents')
    await seedSwrEvents(client, '2026-11-26')
  }
  const key = ['events', '2026-11-26']

  it('query vazia: entra a janela do SWR, com a data em que foi gerada (a API revalida)', async () => {
    const client = new QueryClient()
    await seed(client)
    const data = client.getQueryData<{ pages: SwrPart[] }>(key)
    expect(data && ids(data.pages[0]!)).toEqual(['hoje', 'festival', 'semana-2', 'ultimo'])
    expect(client.getQueryState(key)?.dataUpdatedAt).toBe(Date.parse(GENERATED))
  })

  it('a query já tem dados mais novos (a API respondeu antes): nada muda', async () => {
    const client = new QueryClient()
    const fresh = { pages: [{ start: '2026-11-26', end: '2026-12-10', items: [] }], pageParams: ['2026-11-26'] }
    client.setQueryData(key, fresh, { updatedAt: Date.parse('2026-11-26T11:00:00Z') })
    await seed(client)
    expect(client.getQueryData(key)).toBe(fresh)
  })

  it('dados mais velhos (HTML do deploy): troca a primeira página e mantém as outras', async () => {
    const client = new QueryClient()
    const next = { start: '2026-12-10', end: '2026-12-24', items: [] }
    client.setQueryData(
      key,
      { pages: [{ start: '2026-11-26', end: '2026-12-10', items: [] }, next], pageParams: ['2026-11-26', '2026-12-10'] },
      { updatedAt: Date.parse('2026-11-26T05:00:00Z') },
    )
    await seed(client)
    const data = client.getQueryData<{ pages: SwrPart[]; pageParams: string[] }>(key)
    expect(data?.pages).toHaveLength(2)
    expect(data && ids(data.pages[0]!)).toHaveLength(4)
    expect(data?.pages[1]).toBe(next)
    expect(data?.pageParams).toEqual(['2026-11-26', '2026-12-10'])
  })
})
