import { useEffect, useState } from 'react'
import ThemeToggle from '../components/ThemeToggle'
import { Chip } from '../components/ui/Chip'
import { Card } from '../components/ui/Card'
import { GENRES } from '../domain/genres'

export default function Settings() {
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

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Ajustes</h2>

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

      {/* Provisório: vitrine das cores de gênero para conferir os dois temas. */}
      <Card className="space-y-2">
        <span className="text-sm">Cores dos gêneros</span>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Chip key={genre} genre={genre} />
          ))}
          <Chip label="Sem gênero" />
        </div>
      </Card>
    </section>
  )
}
