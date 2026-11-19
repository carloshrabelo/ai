import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

// Peças comuns das páginas da área de teste (/teste). O período (RangeFields) está em features/range.

/** Volta ao índice da área de teste. */
export function BackToTest() {
  return (
    <Link to="/teste" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" />
      Teste
    </Link>
  )
}
