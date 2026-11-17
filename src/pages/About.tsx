export default function About() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold md:text-3xl">Sobre</h2>
      <ul className="list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-400">
        <li>React + TypeScript + Vite</li>
        <li>React Router (data router com rotas lazy)</li>
        <li>Tailwind CSS v4, mobile first</li>
        <li>PWA com vite-plugin-pwa (Workbox)</li>
      </ul>
    </section>
  )
}
