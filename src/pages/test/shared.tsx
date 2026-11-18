import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { type IsoDate, isIsoDate } from '../../data/dates'
import type { useEventsInRange } from './useEventsInRange'

// Peças comuns das páginas da área de teste (/teste).

type Range = Pick<ReturnType<typeof useEventsInRange>, 'from' | 'setFrom' | 'to' | 'setTo'>

export function RangeFields({ from, setFrom, to, setTo }: Range) {
  return (
    <div className="flex flex-wrap items-end gap-3 text-sm">
      <DateField label="De" value={from} onChange={setFrom} />
      <DateField label="Até" value={to} onChange={setTo} />
    </div>
  )
}

function DateField({ label, value, onChange }: { label: string; value: IsoDate; onChange: (value: IsoDate) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-fg-muted">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => isIsoDate(e.target.value) && onChange(e.target.value)}
        className="h-11 rounded-lg border border-border bg-surface px-3"
      />
    </label>
  )
}

/** Volta ao índice da área de teste. */
export function BackToTest() {
  return (
    <Link to="/teste" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
      <ArrowLeft className="size-4" aria-hidden="true" />
      Teste
    </Link>
  )
}
