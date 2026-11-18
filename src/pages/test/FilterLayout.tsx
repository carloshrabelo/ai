import { useState } from 'react'
import { Link } from 'react-router'
import { Card } from '../../components/ui/Card'
import { FILTER_LAYOUTS, type FilterLayout as Layout, loadFilterLayout, saveFilterLayout } from '../../features/genres/filterLayout'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'
import { BackToTest } from './shared'

const OPTIONS: Record<Layout, { title: string; description: string }> = {
  sidebar: { title: 'Na sidebar (atual)', description: 'Acordeon na coluna da esquerda, fechado por padrão.' },
  scroll: {
    title: 'Barra horizontal, uma linha',
    description: 'No topo da lista, logo abaixo dos dias. Os estilos que não cabem rolam para o lado.',
  },
  wrap: { title: 'Barra horizontal, várias linhas', description: 'No topo da lista; todos os estilos visíveis, quebrando em linhas.' },
}

/**
 * Página de teste (/teste/filtros, só com VITE_TEST_PAGES=true): onde ficam os filtros de estilo no
 * computador (a partir de 1280px). A escolha fica salva neste aparelho e vale ao abrir a agenda.
 */
export default function FilterLayout() {
  useDocumentHead({ title: 'Filtros (teste)', description: 'Layout dos filtros no computador', canonical: `${siteUrl()}teste/filtros`, noindex: true })
  const [layout, setLayout] = useState(loadFilterLayout)

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <BackToTest />
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Layout dos filtros no computador</h2>
          <p className="text-sm text-fg-muted">
            Vale só a partir de 1280px de largura; no celular e no tablet os filtros continuam no botão com o drawer. Fica salvo neste
            aparelho.
          </p>
        </div>
        <fieldset className="space-y-2">
          <legend className="sr-only">Layout</legend>
          {FILTER_LAYOUTS.map((value) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                layout === value ? 'border-brand bg-brand/10' : 'border-border hover:bg-surface-muted'
              }`}
            >
              <input
                type="radio"
                name="filter-layout"
                value={value}
                checked={layout === value}
                onChange={() => {
                  setLayout(value)
                  saveFilterLayout(value)
                }}
                className="mt-0.5 size-4"
              />
              <span>
                <span className="font-semibold">{OPTIONS[value].title}</span>
                <span className="mt-0.5 block text-fg-muted">{OPTIONS[value].description}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <Link to="/" className="inline-flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90">
          Abrir a agenda
        </Link>
      </Card>
    </section>
  )
}
