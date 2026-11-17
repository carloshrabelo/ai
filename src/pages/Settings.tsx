import { useEffect, useState } from 'react'

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
      <h2 className="text-2xl font-bold md:text-3xl">Ajustes</h2>
      <div className="flex min-h-14 items-center justify-between rounded-xl border border-slate-200 px-4 dark:border-slate-800">
        <span>Conexão</span>
        <span className={online ? 'text-emerald-600' : 'text-amber-600'}>
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
    </section>
  )
}
