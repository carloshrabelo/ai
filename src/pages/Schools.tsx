import { School } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'

export default function Schools() {
  const { t } = useI18n()
  return (
    <section className="flex flex-col items-center gap-4 py-12 text-center">
      <School className="size-12 text-fg-muted" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{t.schools.soon}</h2>
      <p className="max-w-sm text-sm text-fg-muted">{t.schools.text}</p>
    </section>
  )
}
