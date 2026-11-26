const env = import.meta.env

/** Usa o mock a menos que VITE_USE_MOCK seja explicitamente "false". */
export const USE_MOCK = env.VITE_USE_MOCK !== 'false'

export const GOOGLE_API_KEY = env.VITE_GOOGLE_API_KEY ?? ''

/**
 * Pasta dos arquivos do SWR (src/api/swrEvents.ts), no branch `data` do repositório. Vazia no mock;
 * VITE_SWR_URL troca (ou desliga, com "off").
 */
const DEFAULT_SWR_URL = 'https://raw.githubusercontent.com/carloshrabelo/lisbon-social-dances/data/swr/'
export const SWR_URL = USE_MOCK || env.VITE_SWR_URL === 'off' ? '' : (env.VITE_SWR_URL ?? DEFAULT_SWR_URL)

/** Atraso artificial do mock, em ms (0 = responde na hora). */
export const MOCK_DELAY_MS = Math.max(0, Number(env.VITE_MOCK_DELAY_MS) || 0)

export const TIME_ZONE = 'Europe/Lisbon'

/** Tamanho de cada janela buscada na API, em dias. */
export const WINDOW_DAYS = 14

/** Quantas janelas vazias seguidas encerram o feed. */
export const EMPTY_WINDOWS_TO_STOP = 2

if (!USE_MOCK && !GOOGLE_API_KEY) {
  throw new Error('VITE_USE_MOCK=false exige VITE_GOOGLE_API_KEY. Veja .env.example.')
}
