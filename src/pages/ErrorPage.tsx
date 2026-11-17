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
      <h1 className="text-2xl font-bold">Algo deu errado</h1>
      <p className="text-slate-600 dark:text-slate-400">{message}</p>
      <button
        className="min-h-11 rounded-xl bg-brand px-4 font-medium text-white"
        onClick={() => window.location.reload()}
      >
        Recarregar
      </button>
    </div>
  )
}
