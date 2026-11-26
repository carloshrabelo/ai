interface ImportMetaEnv {
  /** "true" usa src/mocks/events.json; "false" usa a Google Calendar API. Padrão: mock. */
  readonly VITE_USE_MOCK?: 'true' | 'false'
  /** Chave da Google Calendar API, obrigatória quando VITE_USE_MOCK=false. */
  readonly VITE_GOOGLE_API_KEY?: string
  /** Código do site no GoatCounter (vazio = analytics desligado). */
  readonly VITE_GOATCOUNTER_CODE?: string
  /** Só no mock: atraso artificial da resposta, em ms. */
  readonly VITE_MOCK_DELAY_MS?: string
  /** "true" liga as páginas de teste (/test/prices). Só para uso local: não configure no deploy. */
  readonly VITE_TEST_PAGES?: 'true' | 'false'
  readonly VITE_SWR_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Commit do build (7 caracteres) ou "local". Definido em vite.config.ts. */
declare const __APP_VERSION__: string
/** Data/hora do build (ISO). */
declare const __APP_BUILD_TIME__: string
/** Service worker ligado no `pnpm dev` (PWA_DEV=true). */
declare const __PWA_IN_DEV__: boolean
