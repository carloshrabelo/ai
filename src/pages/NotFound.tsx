import { Link } from 'react-router'

export default function NotFound() {
  return (
    <section className="space-y-4 py-12 text-center">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-slate-600 dark:text-slate-400">Página não encontrada.</p>
      <Link to="/" className="inline-flex min-h-11 items-center font-medium text-brand">
        Voltar ao início
      </Link>
    </section>
  )
}
