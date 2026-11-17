import { School } from 'lucide-react'

export default function Schools() {
  return (
    <section className="flex flex-col items-center gap-4 py-12 text-center">
      <School className="size-12 text-fg-muted" aria-hidden="true" />
      <h2 className="text-lg font-semibold">Em breve</h2>
      <p className="max-w-sm text-sm text-fg-muted">A lista de escolas de dança ainda está sendo preparada.</p>
    </section>
  )
}
