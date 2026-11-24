import { expect, test } from '@playwright/test'
import { openAgenda } from './helpers'

/** Primeiro evento carregado na agenda, lido do cache salvo no aparelho (o persister do TanStack Query). */
async function firstCachedEvent(page: import('@playwright/test').Page) {
  // O persister grava aos poucos: espera até a query dos eventos estar no que foi salvo.
  const read = () =>
    page.evaluate(() => {
      const raw = localStorage.getItem('lisbon-social-dance:queries')
      if (!raw) return null
      const cache = JSON.parse(raw)
      const query = cache.clientState.queries.find((q: { queryKey: unknown[] }) => q.queryKey[0] === 'events')
      const item = query?.state.data.pages[0]?.items[0]
      return item ? { id: item.id as string, summary: item.summary as string } : null
    })
  await expect.poll(read, { timeout: 10_000 }).not.toBeNull()
  return (await read())!
}

test('link antigo ?event=<id> vai para a página do evento', async ({ page }) => {
  await openAgenda(page)
  const { id } = await firstCachedEvent(page)
  await page.goto(`/?event=${encodeURIComponent(id)}&genres=salsa`)
  // Evento que começou antes do início da lista (ex.: noite anterior) também leva ?date= do dia dele.
  await expect(page).toHaveURL(/\/event\/[^/]+\/\?genres=salsa(&date=\d{4}-\d{2}-\d{2})?$/)
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
