import { ArrowLeftIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

// Peças comuns das páginas da área de teste (/lab). O período (RangeFields) está em features/range.

/** Volta ao índice da área de teste. */
export function BackToTest() {
  return (
    <Link to="/lab" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
      <ArrowLeftIcon className="size-4" aria-hidden="true" />
      Lab
    </Link>
  )
}
