import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { openAgenda, tracked } from './helpers'

/**
 * Acessibilidade (axe-core): WCAG 2.1 AA + boas práticas nas telas principais, nos dois temas. Substitui o antigo
 * scripts/a11y-check.mjs; mesmas regras, e falha com qualquer violação.
 */
async function expectNoViolations(page: Page) {
  // Tira o mouse de cima do que foi clicado: o hover num card abre o tooltip do pino no mapa, que o Leaflet cria
  // um instante antes de o React preencher o texto (o axe pegava o tooltip vazio, sem nome, às vezes).
  await page.mouse.move(0, 0)
  await expect(page.locator('.leaflet-tooltip')).toHaveCount(0)
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze()
  const summary = violations.map(
    (v) =>
      `[${v.impact}] ${v.id} (${v.nodes.length}): ${v.help}\n  ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join('\n  ')}`,
  )
  expect(summary, summary.join('\n')).toEqual([])
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`tema ${scheme === 'light' ? 'claro' : 'escuro'}`, () => {
    test.beforeEach(async ({ page }) => page.emulateMedia({ colorScheme: scheme }))

    test('agenda', async ({ page }) => {
      await openAgenda(page)
      await expectNoViolations(page)
    })

    test('filtros abertos', async ({ page }) => {
      await openAgenda(page)
      await tracked(page, 'filters.open').filter({ visible: true }).click()
      await expect(tracked(page, 'filters.group', 'Latinas').filter({ visible: true })).toBeVisible()
      await expectNoViolations(page)
    })

    test('detalhes do evento', async ({ page }) => {
      await openAgenda(page)
      await tracked(page, 'event.open').first().click()
      await expect(page).toHaveURL(/\/event\//)
      await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()
      await expectNoViolations(page)
    })

    test('mapa (celular) e Sobre', async ({ page }, testInfo) => {
      await page.goto(testInfo.project.name === 'celular' ? '/map' : '/about')
      await expect(page.getByRole('main')).toBeVisible()
      await page.waitForLoadState('networkidle')
      await expectNoViolations(page)
    })
  })
}
