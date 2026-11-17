interface ImportMetaEnv {
  /** "true" usa src/mocks/events.json; "false" usa a Google Calendar API. Padrão: mock. */
  readonly VITE_USE_MOCK?: 'true' | 'false'
  /** Chave da Google Calendar API, obrigatória quando VITE_USE_MOCK=false. */
  readonly VITE_GOOGLE_API_KEY?: string
  /** Só no mock: atraso artificial da resposta, em ms. */
  readonly VITE_MOCK_DELAY_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
