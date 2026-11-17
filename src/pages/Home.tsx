import { Link } from 'react-router'
import InstallButton from '../components/InstallButton'

export default function Home() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold md:text-3xl">Bem-vindo 👋</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Aplicação React + Vite + React Router, mobile first e instalável como WebApp.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="mb-3 font-semibold">Instale no seu dispositivo</h3>
        <InstallButton />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {['Funciona offline', 'Atualização automática', 'Tela cheia', 'Layout responsivo'].map((f) => (
          <div key={f} className="rounded-xl bg-slate-100 p-4 font-medium dark:bg-slate-900">
            {f}
          </div>
        ))}
      </div>

      <Link to="/about" className="inline-flex min-h-11 items-center font-medium text-brand">
        Saiba mais →
      </Link>
    </section>
  )
}
