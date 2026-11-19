import { type IsoDate, isIsoDate } from '../../lib/dates'
import type { useEventsInRange } from './useEventsInRange'

// Campos "De" e "Até" do período (Revisão e páginas de teste).

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
