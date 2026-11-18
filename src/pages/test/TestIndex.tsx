import { ChevronRight, type LucideIcon, Megaphone, Tag, TicketX } from 'lucide-react'
import { Link } from 'react-router'
import { Card } from '../../components/ui/Card'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'

type Tool = { to: string; title: string; description: string; icon: LucideIcon }
type Section = { title: string; description: string; tools: Tool[] }

/** Ferramentas da área de teste, por seção. Página nova: criar em src/pages/test/, registrar a rota
 *  em src/router.tsx (dentro de "teste") e acrescentar aqui. */
const SECTIONS: Section[] = [
  {
    title: 'Dicionários de tradução',
    description: 'Textos que vêm do calendário e são traduzidos no app (src/i18n/).',
    tools: [
      {
        to: '/teste/precos',
        title: 'Preços',
        description: 'Preços distintos dos eventos, com a versão em pt-BR e en-US e o que ficou sem tradução.',
        icon: Tag,
      },
      {
        to: '/teste/sem-preco',
        title: 'Eventos sem preço',
        description: 'Eventos sem preço no título, com o trecho da descrição que cita valor, quando houver.',
        icon: TicketX,
      },
    ],
  },
  {
    title: 'Promotores',
    description: 'Quem organiza cada evento, lido da descrição (src/domain/promoters.ts).',
    tools: [
      {
        to: '/teste/promotores',
        title: 'Responsáveis pelos eventos',
        description: 'Perfis do Instagram e "Organização: …" citados nos eventos, por promotor ou por evento.',
        icon: Megaphone,
      },
    ],
  },
]

/**
 * Área de teste (/teste, só com VITE_TEST_PAGES=true): índice das ferramentas internas, usadas para
 * revisar dados e configurações. Sem i18n: não é para o público.
 */
export default function TestIndex() {
  useDocumentHead({ title: 'Teste', description: 'Ferramentas internas', canonical: `${siteUrl()}teste/`, noindex: true })
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-fg-muted">
        Área interna, visível só com <code className="rounded bg-surface-muted px-1">VITE_TEST_PAGES=true</code> no{' '}
        <code className="rounded bg-surface-muted px-1">.env.local</code>. Não vai para o site publicado.
      </p>
      {SECTIONS.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <p className="text-sm text-fg-muted">{section.description}</p>
          <ul className="space-y-2">
            {section.tools.map(({ to, title, description, icon: Icon }) => (
              <li key={to}>
                <Card className="relative flex items-center gap-3 transition-shadow hover:shadow-md">
                  <Icon className="size-6 shrink-0 text-brand" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">
                      <Link to={to} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-brand">
                        {title}
                      </Link>
                    </h3>
                    <p className="text-sm text-fg-muted">{description}</p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
