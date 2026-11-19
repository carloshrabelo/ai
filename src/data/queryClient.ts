import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { safeStorage } from '../lib/storage'
import { USE_MOCK } from './config'

/** Quanto tempo os eventos salvos no aparelho valem para abrir o app sem internet. */
const PERSIST_MAX_AGE = 24 * 60 * 60_000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      // Precisa ser ≥ PERSIST_MAX_AGE, senão o cache é descartado antes de ser salvo.
      gcTime: PERSIST_MAX_AGE,
    },
  },
})

/**
 * Salva os eventos já carregados no aparelho: o app abre com eles mesmo sem internet
 * e atualiza assim que houver conexão.
 */
export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: createSyncStoragePersister({ storage: safeStorage(), key: 'lisbon-social-dance:queries' }),
  maxAge: PERSIST_MAX_AGE,
  // Mock e API não se misturam; mudar a versão do formato descarta o que estava salvo.
  buster: `events-v2-${USE_MOCK ? 'mock' : 'api'}`, // v2: eventos com `source`
  dehydrateOptions: {
    // Eventos e coordenadas buscadas no navegador (inclusive "não achou", para não repetir a busca).
    shouldDehydrateQuery: (query) =>
      (query.queryKey[0] === 'events' || query.queryKey[0] === 'geocode') && query.state.status === 'success',
  },
}
