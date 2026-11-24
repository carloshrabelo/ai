import { expect, test } from '@playwright/test'
import { activeStripDay, openAgenda, strip, tracked, waitScrollEnd } from './helpers'

const isMobile = (name: string) => name === 'celular'

test('a lista carrega com cards e títulos de dia', async ({ page }) => {
  await openAgenda(page)
  await expect(page.locator('h2[data-day]').first()).toBeVisible()
  expect(await page.locator('article').count()).toBeGreaterThan(3)
})

test.describe('faixa de dias', () => {
  test('o dia ativo fica no centro da faixa', async ({ page }) => {
    await openAgenda(page)
    const list = await strip(page).boundingBox()
    const active = await strip(page).locator('button[aria-pressed="true"]').boundingBox()
    expect(Math.abs(active!.x + active!.width / 2 - (list!.x + list!.width / 2))).toBeLessThan(3)
  })

  test('clicar num dia posterior e depois num anterior rola a lista até cada um', async ({ page }) => {
    await openAgenda(page)
    const days = await page.locator('h2[data-day]').evaluateAll((headings) => headings.map((h) => (h as HTMLElement).dataset.day!))
    const [earlier, later] = [days[1], days[Math.min(5, days.length - 1)]]

    await strip(page).locator(`li[data-strip-day="${later}"] button`).click()
    const down = await waitScrollEnd(page)
    expect(down).toBeGreaterThan(0)
    expect(await activeStripDay(page)).toBe(later)

    await strip(page).locator(`li[data-strip-day="${earlier}"] button`).click()
    const up = await waitScrollEnd(page)
    expect(up).toBeLessThan(down)
    expect(await activeStripDay(page)).toBe(earlier)
  })

  test('um dia anterior ao início do feed recomeça a lista nele', async ({ page }) => {
    await openAgenda(page)
    const first = strip(page).locator('li').first()
    const day = await first.getAttribute('data-strip-day')
    await first.locator('button').click()
    await expect(page).toHaveURL(new RegExp(`[?&]date=${day}`))
    // A URL muda antes de a agenda remontar com o novo início: espera a faixa atualizar.
    await expect.poll(() => activeStripDay(page)).toBe(day)
  })
})

test('"Outra data" abre o calendário e escolhe o dia', async ({ page }, testInfo) => {
  await openAgenda(page)
  await tracked(page, 'dates.other-date').filter({ visible: true }).click()
  const picker = isMobile(testInfo.project.name) ? page.locator('dialog[open]') : page.getByRole('dialog', { name: 'Escolher data' })
  await expect(picker).toBeVisible()
  await picker.getByRole('button', { name: 'Próximo mês' }).click()
  const day = picker.locator('[data-track="dates.calendar-day"]').filter({ hasText: /^15$/ }).first()
  const value = await day.getAttribute('data-track-value')
  await day.click()
  await expect(page).toHaveURL(new RegExp(`[?&]date=${value}`))
  await expect(tracked(page, 'dates.other-date').filter({ visible: true })).toHaveAttribute('aria-pressed', 'true')
})

test.describe('filtro', () => {
  test('desmarcar um estilo deixa o conjunto intermediário; marcar de novo volta o conjunto', async ({ page }) => {
    await openAgenda(page)
    await tracked(page, 'filters.open').filter({ visible: true }).click()
    const latinas = tracked(page, 'filters.group', 'Latinas').filter({ visible: true })
    const bachata = tracked(page, 'filters.genre', 'Bachata').filter({ visible: true })

    await latinas.click()
    await expect(latinas).toHaveAttribute('aria-pressed', 'true')
    await expect(bachata).toHaveAttribute('aria-pressed', 'true')
    await expect(bachata).toBeEnabled()
    await expect(page).toHaveURL(/genres=latinas/)

    await bachata.click()
    await expect(latinas).toHaveAttribute('aria-pressed', 'mixed')
    await expect(bachata).toHaveAttribute('aria-pressed', 'false')
    await expect(page).toHaveURL(/genres=salsa,salsa-cubana,merengue/)

    await bachata.click()
    await expect(latinas).toHaveAttribute('aria-pressed', 'true')

    await tracked(page, 'filters.clear').filter({ visible: true }).click()
    await expect(latinas).toHaveAttribute('aria-pressed', 'false')
    await expect(page).not.toHaveURL(/genres=/)
  })
})

test('abrir e fechar os detalhes: URL do evento, título e "Abrir no mapa" fixos', async ({ page }) => {
  await openAgenda(page)
  const card = tracked(page, 'event.open').first()
  const slug = await card.getAttribute('data-track-value')
  const title = (await card.textContent())!.trim()
  await card.click()
  await expect(page).toHaveURL(new RegExp(`/event/${slug}/`))
  const heading = page.getByRole('heading', { level: 2, name: title })
  await expect(heading).toBeVisible()
  await expect(page.getByText('Detalhes do evento')).toHaveCount(0)
  await tracked(page, 'event.close').filter({ visible: true }).click()
  await expect(page).not.toHaveURL(/\/event\//)
})

test.describe('celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'só no celular')

  test('barra inferior: Comunidade, Sobre, Explorar e Agenda', async ({ page }) => {
    await openAgenda(page)
    const nav = page.getByRole('navigation', { name: 'Navegação principal' })
    await nav.getByRole('link', { name: 'Comunidade' }).click()
    await expect(page).toHaveURL(/\/community$/)
    await nav.getByRole('link', { name: 'Sobre' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await nav.getByRole('link', { name: 'Explorar' }).click()
    await expect(page).toHaveURL(/\/map/)
    await nav.getByRole('link', { name: 'Agenda' }).click()
    await expect(page.locator('article').first()).toBeVisible()
  })

  test('/map: data fora do que foi carregado recomeça a janela nela', async ({ page }) => {
    await page.goto('/map')
    await expect(page.locator('[data-slug]').first()).toBeVisible()
    await tracked(page, 'dates.calendar-open').click()
    const picker = page.locator('dialog[open]')
    await picker.getByRole('button', { name: 'Próximo mês' }).click()
    await picker.getByRole('button', { name: 'Próximo mês' }).click()
    const day = picker.locator('[data-track="dates.calendar-day"]').filter({ hasText: /^15$/ }).first()
    const value = await day.getAttribute('data-track-value')
    await day.click()
    await expect(page).toHaveURL(new RegExp(`/map\\?date=${value}`))
    await expect.poll(() => activeStripDay(page)).toBe(value)
  })
})

test('/review carrega', async ({ page }) => {
  await page.goto('/review')
  await expect(page).toHaveTitle(/Revisão/)
  await expect(page.getByRole('main')).toBeVisible()
})
