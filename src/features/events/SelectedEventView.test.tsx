// @vitest-environment jsdom
import { setViewport } from '../../test/dom'
import { screen, waitFor, within } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { eventsInfiniteQueryOptions, flattenEvents } from '../../api/queries'
import type { DanceEvent } from '../../domain/event'
import { todayIso } from '../../lib/dates'
import { renderWithProviders, testQueryClient } from '../../test/render'
import { EventDetailsDrawer, EventDetailsPanel } from './SelectedEventView'

const START = todayIso()
const queryClient = testQueryClient()
let event: DanceEvent

// Eventos do mock (datas deslocadas para perto de hoje), pela mesma query do app. Um evento com descrição e
// local com coordenadas no venues.json (o "Abrir no mapa" aparece sem geocodificar pela rede).
beforeAll(async () => {
  const options = eventsInfiniteQueryOptions(START)
  const data = await queryClient.fetchInfiniteQuery(options)
  const events = flattenEvents(options.select!(data).pages)
  event = events.find((e) => e.description && e.venue?.lat !== undefined && e.title.length > 10)!
})

describe('detalhes do evento: título e "Abrir no mapa" fixos', () => {
  it('painel (desktop): o título fica no header fixo, no lugar do rótulo "Detalhes do evento"', async () => {
    setViewport(1440)
    renderWithProviders(<EventDetailsPanel startDate={START} slug={event.slug} onClose={() => {}} />, { queryClient })
    const heading = await screen.findByRole('heading', { level: 2, name: event.title })
    expect(screen.queryByText('Detalhes do evento')).toBeNull()
    // Um título só (o corpo não repete) e com o foco ao abrir.
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    await waitFor(() => expect(document.activeElement).toBe(heading))
    const header = heading.parentElement!
    expect(header.className).toMatch(/\bsticky\b/)
    expect(within(header).getByRole('button', { name: 'Fechar detalhes' })).toBeTruthy()
  })

  it('"Abrir no mapa" fica fixo logo abaixo do header, pela altura medida em --details-sticky-top', async () => {
    setViewport(1440)
    const { container } = renderWithProviders(<EventDetailsPanel startDate={START} slug={event.slug} onClose={() => {}} />, {
      queryClient,
    })
    const maps = await screen.findByRole('link', { name: /abrir no mapa/i })
    const row = maps.parentElement!
    expect(row.className).toContain('sticky')
    expect(row.className).toContain('top-[var(--details-sticky-top,0px)]')
    // No painel o header gruda 16px acima (sobre o padding): altura (0 no jsdom) − 16.
    const card = container.querySelector('section')!
    expect(card.style.getPropertyValue('--details-sticky-top')).toBe('-16px')
  })

  it('descrição completa, sem "Ver mais"', async () => {
    setViewport(1440)
    renderWithProviders(<EventDetailsPanel startDate={START} slug={event.slug} onClose={() => {}} />, { queryClient })
    const description = await screen.findByRole('region', { name: 'Descrição' })
    expect(description.firstElementChild?.className).not.toContain('line-clamp')
    expect(screen.queryByRole('button', { name: /ver mais/i })).toBeNull()
  })

  it('drawer (celular): voltar + título do evento no header, sem rótulo genérico', async () => {
    renderWithProviders(<EventDetailsDrawer startDate={START} slug={event.slug} onClose={() => {}} />, { queryClient })
    const dialog = document.querySelector('dialog')!
    const header = dialog.querySelector('header')!
    expect(await within(header).findByRole('heading', { level: 2, name: event.title })).toBeTruthy()
    expect(within(header).getByRole('button', { name: 'Voltar' })).toBeTruthy()
    expect(within(dialog).queryByText('Detalhes do evento')).toBeNull()
    expect(dialog.style.getPropertyValue('--details-sticky-top')).toBe('0px')
  })

  it('evento que não existe: "não encontrado" no título', async () => {
    setViewport(1440)
    renderWithProviders(<EventDetailsPanel startDate={START} slug="nao-existe" onClose={() => {}} />, { queryClient })
    expect(await screen.findByRole('heading', { level: 2, name: 'Evento não encontrado nas datas carregadas.' })).toBeTruthy()
  })
})
