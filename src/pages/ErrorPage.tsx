import { isRouteErrorResponse, useRouteError } from 'react-router'
import { WarningCircleIcon } from '@phosphor-icons/react'
import { Button } from '../components/ui/Button'
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
      <WarningCircleIcon className="size-16 text-brand" aria-hidden="true" />
      <h1 className="text-2xl font-bold">{t.errors.title}</h1>
      <p className="text-fg-muted">{message}</p>
      <Button onClick={() => window.location.reload()}>{t.errors.reload}</Button>
    </div>
  )
}
