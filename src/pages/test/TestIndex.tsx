import {
  AddressBookIcon,
  CaretRightIcon,
  MegaphoneIcon,
  PaletteIcon,
  ProhibitInsetIcon,
  ShapesIcon,
  TagIcon,
  TextAaIcon,
  TicketIcon,
  UsersIcon,
  type Icon,
} from '@phosphor-icons/react'
import { Link } from 'react-router'
import { Card } from '../../components/ui/Card'
import { siteUrl, useDocumentHead } from '../../seo/useDocumentHead'

type Tool = { to: string; title: string; description: string; icon: Icon }
type Section = { title: string; description: string; tools: Tool[] }

/** Ferramentas da área de teste, por seção. Página nova: criar em src/pages/test/, registrar a rota
 *  em src/router.tsx (dentro de "teste") e acrescentar aqui. */
const SECTIONS: Section[] = [
  {
    title: 'Visual',
    description: 'Opções de interface para escolher antes de mudar o app.',
    tools: [
      {
        to: '/lab/icons',
        title: 'Ícones e nomes',
        description: 'Sugestões de ícone para Dança e para o filtro, e de nome e ícone para Mapa e Sobre, com prévia.',
        icon: ShapesIcon,
      },
      {
        to: '/lab/genre-colors',
        title: 'Cores dos estilos',
        description: 'Nove paletas para os estilos (a atual, a do Pas de Deux e outras), com prévia nos dois temas e o porquê de cada cor.',
        icon: PaletteIcon,
      },
    ],
  },
  {
    title: 'Dicionários de tradução',
    description: 'Textos que vêm do calendário e são traduzidos no app (src/i18n/).',
    tools: [
      {
        to: '/lab/prices',
        title: 'Preços',
        description: 'Preços distintos dos eventos, com a versão em pt-BR e en-US e o que ficou sem tradução.',
        icon: TagIcon,
      },
      {
        to: '/lab/price-formats',
        title: 'Formato de preços',
        description: 'Jeitos de exibir preços com mais de um valor ("5€ ou 10€"), lado a lado e num card de evento.',
        icon: TicketIcon,
      },
      {
        to: '/lab/no-price',
        title: 'Eventos sem preço',
        description: 'Eventos sem preço no título, com o trecho da descrição que cita valor, quando houver.',
        icon: ProhibitInsetIcon,
      },
    ],
  },
  {
    title: 'Promotores',
    description: 'Quem organiza cada evento, lido da descrição (src/domain/promoters.ts).',
    tools: [
      {
        to: '/lab/promoters',
        title: 'Responsáveis pelos eventos',
        description: 'Perfis do Instagram e "Organização: …" citados nos eventos, por promotor ou por evento.',
        icon: MegaphoneIcon,
      },
    ],
  },
  {
    title: 'Diretório de promotores',
    description: 'src/content/promoters.json, atualizado todo dia pela Action "Update promoters" (pnpm promoters:update).',
    tools: [
      {
        to: '/lab/promoter-directory',
        title: 'Promotores: redes, locais e estilos',
        description: 'Um registro por perfil, com as redes sociais, os locais e os estilos dos eventos e o último evento.',
        icon: AddressBookIcon,
      },
      {
        to: '/lab/people',
        title: 'Envolvidos por grupo',
        description: 'Promotores, professores, DJs, locais e outros, com foto (ou iniciais) e o @ de cada um.',
        icon: UsersIcon,
      },
      {
        to: '/review',
        title: 'Revisão do texto dos eventos (pública)',
        description: 'Ortografia e perfis escritos errado, com o texto corrigido para copiar e o link do Google Agenda.',
        icon: TextAaIcon,
      },
    ],
  },
]

/**
 * Área de teste (/lab, pública mas sem link no app): índice das ferramentas internas, usadas para
 * revisar dados e configurações. Sem i18n: não é para o público.
 */
export default function TestIndex() {
  useDocumentHead({ title: 'Teste', description: 'Ferramentas internas', canonical: `${siteUrl()}lab/`, noindex: true })
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-fg-muted">
        Área interna: aberta para quem tem o link, mas sem link no app (o item “Teste” do menu só aparece com{' '}
        <code className="rounded bg-surface-muted px-1">VITE_TEST_PAGES=true</code> no{' '}
        <code className="rounded bg-surface-muted px-1">.env.local</code>) e fora dos buscadores.
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
                      <Link
                        to={to}
                        className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-brand"
                      >
                        {title}
                      </Link>
                    </h3>
                    <p className="text-sm text-fg-muted">{description}</p>
                  </div>
                  <CaretRightIcon className="size-5 shrink-0 text-fg-muted" aria-hidden="true" />
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
