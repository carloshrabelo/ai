import { defineConfig, devices } from '@playwright/test'

/**
 * Testes de ponta a ponta (`pnpm e2e`), em `e2e/`. Rodam contra o `pnpm dev` com o mock (dados fixos, sem chave
 * da API) e sem as páginas de teste no menu. Localmente usam o Chrome instalado; no CI, o Chromium do Playwright
 * (`pnpm exec playwright install --with-deps chromium`).
 */
const PORT = 5175
const CI = !!process.env.CI

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'pt-BR',
    timezoneId: 'Europe/Lisbon',
    // Sem as animações decorativas (fade-in dos cards): o axe mede as cores no estado final.
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    ...(CI ? {} : { channel: 'chrome' }),
  },
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'], ...(CI ? {} : { channel: 'chrome' }) } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    env: { VITE_USE_MOCK: 'true', VITE_TEST_PAGES: 'false', VITE_MOCK_DELAY_MS: '0' },
    timeout: 60_000,
  },
})
