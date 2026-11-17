const env = import.meta.env

/** Usa o mock a menos que VITE_USE_MOCK seja explicitamente "false". */
export const USE_MOCK = env.VITE_USE_MOCK !== 'false'

export const GOOGLE_API_KEY = env.VITE_GOOGLE_API_KEY ?? ''

if (!USE_MOCK && !GOOGLE_API_KEY) {
  throw new Error('VITE_USE_MOCK=false exige VITE_GOOGLE_API_KEY. Veja .env.example.')
}
