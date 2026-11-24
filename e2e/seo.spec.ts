import { expect, test } from '@playwright/test'
import { openAgenda } from './helpers'

/** Primeiro evento carregado na agenda, lido do cache salvo no aparelho (o persister do TanStack Query). */
async function firstCachedEvent(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => localStorage.getItem('lisbon-social-dance:queries')), { timeout: 10_000 }).not.toBeNull()
  return page.evaluate(() => {
    const cache = JSON.parse(localStorage.getItem('lisbon-social-dance:queries')!)
    const query = cache.clientState.queries.find((q: { queryKey: unknown[] }) => q.queryKey[0] === 'events')
    const item = query.state.data.pages[0].items[0]
    return { id: item.id as string, summary: item.summary as string }
  })
}

test('link antigo ?event=<id> vai para a página do evento', async ({ page }) => {
  await openAgenda(page)
  const { id } = await firstCachedEvent(page)
  await page.goto(`/?event=${encodeURIComponent(id)}&genres=salsa`)
  await expect(page).toHaveURL(/\/event\/[^/]+\/\?genres=salsa$/)
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()
})

test('link antigo com id que não existe só limpa o parâmetro', async ({ page }) => {
  await page.goto('/?event=nao-existe-123')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('article').first()).toBeVisible()
})

test('a agenda tem JSON-LD ItemList e o evento aberto, DanceEvent', async ({ page }) => {
  await openAgenda(page)
  const types = await page.evaluate(() =>
    [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!)['@type']),
  )
  expect(types).toContain('ItemList')
})
