import { isRouteErrorResponse, useRouteError } from 'react-router'

export default function ErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Erro desconhecido'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Algo deu errado</h1>
      <p className="text-fg-muted">{message}</p>
      <button
        className="min-h-11 rounded-lg bg-brand px-4 text-sm font-medium text-brand-fg"
        onClick={() => window.location.reload()}
      >
        Recarregar
      </button>
    </div>
  )
}
