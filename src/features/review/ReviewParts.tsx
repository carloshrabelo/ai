import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'

/** Barra de progresso da verificação de ortografia (textos × línguas já verificados). */
export function SpellingProgress({ done, total }: { done: number; total: number }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-fg-muted">
        <span>Verificando ortografia (a API gratuita tem limite por minuto)</span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Verificando ortografia"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} de ${total}`}
        className="h-2 overflow-hidden rounded-full bg-surface-muted"
      >
        <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

/** Card de resultado carregando: mesmas medidas do card real (título, datas, erros, botão). */
export function ReviewCardSkeleton() {
  return (
    <Card className="space-y-3" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-11 w-52" rounded="rounded-lg" />
    </Card>
  )
}

/** Caixa de seleção com rótulo (área de toque de 44px). */
export function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4" />
      {label}
    </label>
  )
}
