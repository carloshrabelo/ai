import { expect, type Page } from '@playwright/test'

/** Elemento pelo nome de rastreamento (`data-track`, ver src/analytics/track.ts): seletor estável. */
export const tracked = (page: Page, id: string, value?: string) =>
  page.locator(value === undefined ? `[data-track="${id}"]` : `[data-track="${id}"][data-track-value="${value}"]`)

/** Abre a agenda e espera os cards (mock, sem atraso). */
export async function openAgenda(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.locator('article').first()).toBeVisible()
}

/** Faixa de dias e o dia ativo nela. */
export const strip = (page: Page) => page.getByRole('list', { name: 'Dias' })
export const activeStripDay = (page: Page) =>
  strip(page)
    .locator('li', { has: page.locator('button[aria-pressed="true"]') })
    .getAttribute('data-strip-day')

/** Espera a página parar de rolar (rolagem suave). */
export async function waitScrollEnd(page: Page) {
  let last = -1
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => window.scrollY)
    if (y === last) return y
    last = y
    await page.waitForTimeout(100)
  }
  return last
}
