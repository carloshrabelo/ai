// Teste de layout dos filtros no computador (a partir de `xl`), escolhido em /teste/filtros e salvo no
// aparelho. Só vale com VITE_TEST_PAGES=true; sem isso, os filtros ficam sempre na sidebar.
//   sidebar: acordeon na sidebar (padrão)
//   scroll:  barra horizontal no topo da lista, uma linha com rolagem
//   wrap:    barra horizontal no topo da lista, quebrando em mais linhas

export const FILTER_LAYOUTS = ['sidebar', 'scroll', 'wrap'] as const
export type FilterLayout = (typeof FILTER_LAYOUTS)[number]

const KEY = 'lisbon-social-dance:test-filter-layout'

export function loadFilterLayout(): FilterLayout {
  if (import.meta.env.VITE_TEST_PAGES !== 'true') return 'sidebar'
  try {
    const value = window.localStorage.getItem(KEY)
    return FILTER_LAYOUTS.find((layout) => layout === value) ?? 'sidebar'
  } catch {
    return 'sidebar'
  }
}

export function saveFilterLayout(layout: FilterLayout) {
  try {
    window.localStorage.setItem(KEY, layout)
  } catch {
    // sem storage
  }
}
