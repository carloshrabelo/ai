import { isRouteErrorResponse, useRouteError } from 'react-router'
import { useI18n } from '../i18n/useI18n'

export default function ErrorPage() {
  const { t } = useI18n()
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : t.errors.unknown

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t.errors.title}</h1>
      <p className="text-fg-muted">{message}</p>
      <button
        className="min-h-11 rounded-lg bg-brand px-4 text-sm font-medium text-brand-fg"
        onClick={() => window.location.reload()}
      >
        {t.errors.reload}
      </button>
    </div>
  )
}
