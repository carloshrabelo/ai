import { useEffect, useState } from 'react'
import InstallButton from '../components/InstallButton'
import ThemeToggle from '../components/ThemeToggle'
import { Card } from '../components/ui/Card'

/** Rota "/info". Conteúdo completo no passo 8 do PLANO.md. */
export default function Info() {
  const online = useOnline()

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">Sobre</h2>
        <p className="text-sm text-fg-muted">
          Agenda de práticas, festas e outros eventos de dança, com dados de um calendário mantido pelas comunidades
          de dança.
        </p>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-sm">Tema</span>
        <ThemeToggle />
      </Card>

      <Card className="flex items-center justify-between">
        <span className="text-sm">Conexão</span>
        <span className={`text-sm ${online ? 'text-emerald-600' : 'text-amber-600'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      </Card>

      <Card className="space-y-2">
        <span className="text-sm">Instalar o app</span>
        <InstallButton />
      </Card>
    </section>
  )
}

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}
