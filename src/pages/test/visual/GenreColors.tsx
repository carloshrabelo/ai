import { WarningIcon } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import { Card } from '../../../components/ui/Card'
import { siteUrl, useDocumentHead } from '../../../seo/useDocumentHead'
import { BackToTest } from '../shared'
import { autoFg, contrast, distance, hsl } from './colorMath'
import { ALL_GENRES, FAMILIES, GOOGLE, type Palette, PALETTES, type Swatch } from './genrePalettes'

/** Superfícies dos dois temas do app (src/index.css), fixas para a prévia mostrar os dois lado a lado. */
const THEMES = {
  light: { name: 'Claro', bg: '#f4f6f8', surface: '#ffffff', fg: '#1c1c1c', muted: '#5b6670', border: '#e5e5e5' },
  dark: { name: 'Escuro', bg: '#131f24', surface: '#202f36', fg: '#f1f7fb', muted: '#9db3bf', border: '#37464f' },
} as const
type ThemeId = keyof typeof THEMES

const BRAND = '#6d3fd9'

/** `tags`: estilos fora da lista (ex.: Fusão), que o app mostra com a cor de "Outros". */
type SampleEvent = { title: string; venue: string; genres: string[]; tags?: string[]; ended?: boolean }

const SAMPLE_EVENTS: SampleEvent[] = [
  { title: 'Social de Salsa & Bachata', venue: 'Armazém 16', genres: ['Salsa', 'Bachata'] },
  { title: 'SBKZ Night', venue: 'Clube Ferroviário', genres: ['Salsa', 'Bachata', 'Kizomba', 'Zouk'] },
  { title: 'Kizomba • Festa da Lua', venue: 'Salão Lua', genres: ['Kizomba', 'Semba', 'Urban Kiz'] },
  { title: 'Forró no Jardim', venue: 'Jardim da Estrela', genres: ['Forró', 'Samba'] },
  { title: 'Swing Jam', venue: 'Bar Irreal', genres: ['Swing', 'Blues', 'West Coast Swing'] },
  { title: 'Milonga de Quinta', venue: 'Casa do Alentejo', genres: ['Tango', 'Bolero'] },
  { title: 'Baile Folk', venue: 'Voz do Operário', genres: ['Tradicionais'] },
  { title: 'Fusão na Praça', venue: 'Largo do Intendente', genres: [], tags: ['Fusão'] },
  { title: 'Baile Sertanejo', venue: 'Casa do Brasil', genres: [], tags: ['Sertanejo'] },
  { title: 'Social de Salsa (já acabou)', venue: 'Armazém 16', genres: ['Salsa', 'Merengue'], ended: true },
]

function colorsOf(swatch: Swatch, theme: ThemeId) {
  const bg = theme === 'dark' ? (swatch.dark ?? swatch.bg) : swatch.bg
  return { bg, fg: swatch.fg ?? autoFg(bg) }
}

function GenreChip({
  palette,
  genre,
  theme,
  umbrella = false,
  label,
}: {
  palette: Palette
  genre: string
  theme: ThemeId
  umbrella?: boolean
  /** Texto no lugar do nome (ex.: "Fusão" com a cor de "Outros"). */
  label?: string
}) {
  const swatch = palette.colors[genre]
  if (!swatch) return null
  const { bg, fg } = colorsOf(swatch, theme)
  return (
    <span
      style={{ backgroundColor: bg, color: fg }}
      className={`inline-flex h-7 shrink-0 items-center px-3 pb-[3px] text-xs font-bold whitespace-nowrap shadow-[inset_0_-3px_0_rgb(0_0_0/0.22)] ${
        umbrella ? 'rounded-lg font-extrabold tracking-wide' : 'rounded-xl'
      }`}
    >
      {label ?? genre}
    </span>
  )
}

/** Prévia de um tema: os filtros por família e alguns cards de evento. */
function Preview({ palette, theme }: { palette: Palette; theme: ThemeId }) {
  const colors = THEMES[theme]
  const surface: CSSProperties = { backgroundColor: colors.surface, borderColor: colors.border, color: colors.fg }
  return (
    <div style={{ backgroundColor: colors.bg, color: colors.fg }} className="space-y-3 rounded-2xl p-3">
      <p className="text-xs font-bold" style={{ color: colors.muted }}>
        Tema {colors.name.toLowerCase()}
      </p>
      <div style={surface} className="space-y-2 rounded-2xl border-2 border-b-4 p-3">
        <p className="text-sm font-bold">Filtros</p>
        {FAMILIES.map((family) => (
          <div key={family.id} className="flex flex-wrap gap-1.5">
            {family.umbrella && <GenreChip palette={palette} genre={family.umbrella} theme={theme} umbrella />}
            {family.genres.map((genre) => (
              <GenreChip key={genre} palette={palette} genre={genre} theme={theme} />
            ))}
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {SAMPLE_EVENTS.map((event) => (
          <article
            key={event.title}
            style={surface}
            className={`space-y-2 rounded-2xl border-2 border-b-4 p-3 ${event.ended ? 'grayscale' : ''}`}
          >
            <h4 className="font-semibold">{event.title}</h4>
            <p className="text-xs" style={{ color: colors.muted }}>
              {event.ended ? 'Encerrado · ' : ''}
              {event.venue}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {event.genres.map((genre) => (
                <GenreChip key={genre} palette={palette} genre={genre} theme={theme} />
              ))}
              {event.tags?.map((tag) => (
                <GenreChip key={tag} palette={palette} genre="Outros" label={tag} theme={theme} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

/** Problemas encontrados pelas contas (contraste, cinza, roxo do app, tema escuro, cores repetidas). */
function analyze(palette: Palette): string[] {
  const issues: string[] = []
  const entries = ALL_GENRES.map((genre) => [genre, palette.colors[genre]] as const).filter(
    (entry): entry is readonly [string, Swatch] => !!entry[1],
  )
  const list = (genres: string[]) => genres.join(', ')

  const lowContrast = entries.filter(([, swatch]) => {
    const { bg, fg } = colorsOf(swatch, 'light')
    return contrast(bg, fg) < 4.5
  })
  if (lowContrast.length > 0)
    issues.push(
      `Texto abaixo de 4,5:1 (reprova no teste de acessibilidade): ${lowContrast
        .map(([genre, swatch]) => {
          const { bg, fg } = colorsOf(swatch, 'light')
          return `${genre} (${contrast(bg, fg).toFixed(1).replace('.', ',')}:1)`
        })
        .join(', ')}.`,
    )

  const gray = entries.filter(([, swatch]) => {
    const { s, l } = hsl(swatch.bg)
    return s < 0.15 && l > 0.15 && l < 0.85
  })
  if (gray.length > 0) issues.push(`Cinza, lido como desativado ou encerrado: ${list(gray.map(([genre]) => genre))}.`)

  const purple = entries.filter(([, swatch]) => distance(swatch.bg, BRAND) < 25)
  if (purple.length > 0) issues.push(`Perto do roxo do app (seleção, links, menu ativo): ${list(purple.map(([genre]) => genre))}.`)

  const vanish = entries.filter(([, swatch]) => contrast(colorsOf(swatch, 'dark').bg, THEMES.dark.surface) < 1.35)
  if (vanish.length > 0) issues.push(`Some no tema escuro (quase a cor do card): ${list(vanish.map(([genre]) => genre))}.`)

  // Cores iguais ou quase iguais (ΔE < 10), só entre estilos (os conjuntos podem repetir a cor de um estilo).
  const umbrellas = new Set(FAMILIES.map((family) => family.umbrella))
  const styles = entries.filter(([genre]) => !umbrellas.has(genre))
  const clusters: string[][] = []
  for (const [genre, swatch] of styles) {
    const cluster = clusters.find((group) => group.some((other) => distance(palette.colors[other]!.bg, swatch.bg) < 10))
    if (cluster) cluster.push(genre)
    else clusters.push([genre])
  }
  for (const cluster of clusters.filter((group) => group.length > 1))
    issues.push(`${cluster.length} estilos com a mesma cor (ou quase): ${list(cluster)}.`)
  return issues
}

function PaletteSection({ palette }: { palette: Palette }) {
  const issues = analyze(palette)
  return (
    <section id={palette.id} className="scroll-mt-20 space-y-3">
      <h2 className="text-xl font-bold">{palette.name}</h2>
      <p className="font-semibold">{palette.summary}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {palette.idea.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="grid gap-3 lg:grid-cols-2">
        <Preview palette={palette} theme="light" />
        <Preview palette={palette} theme="dark" />
      </div>
      <Card className="space-y-2">
        <h3 className="font-bold">Por que cada cor</h3>
        <ul className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
          {ALL_GENRES.map((genre) => {
            const swatch = palette.colors[genre]
            if (!swatch) return null
            return (
              <li key={genre} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-4 shrink-0 rounded border border-border" style={{ backgroundColor: swatch.bg }} />
                <span>
                  <strong>{genre}</strong> <code className="text-xs text-fg-muted">{swatch.bg}</code>
                  {swatch.why && <span className="text-fg-muted"> · {swatch.why}</span>}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>
      {(issues.length > 0 || palette.notes) && (
        <Card className="space-y-2">
          <h3 className="flex items-center gap-2 font-bold">
            <WarningIcon className="size-5 text-brand" aria-hidden="true" />O que não funciona no app
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
            {palette.notes?.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          {issues.length > 0 && (
            <p className="text-xs text-fg-muted">
              Os primeiros itens são calculados pela página (contraste WCAG, saturação e distância entre cores).
            </p>
          )}
        </Card>
      )}
    </section>
  )
}

const REASONS: { title: string; text: string }[] = [
  {
    title: 'Cinza é "desligado"',
    text: 'No app, cinza é a cor do que não está ativo: filtro não marcado, botão desativado e, principalmente, evento que já acabou (o card encerrado fica em tons de cinza; veja o último card de cada prévia). Um evento de hoje em cinza é lido como "já passou" ou "indisponível" e afasta: a pessoa passa por cima. No calendário do Google o cinza é só mais uma cor da grade; aqui ele tem significado.',
  },
  {
    title: 'Uma cor para muitos estilos',
    text: 'No calendário, a cor separa famílias numa grade de horários. No app, um card pode ter três ou quatro tags lado a lado (SBKZ, por exemplo): com a mesma cor, viram uma faixa só e a cor deixa de ajudar. A família pode ser um matiz (laranja, amarelo…) e cada estilo um tom dele.',
  },
  {
    title: 'O roxo é do app',
    text: `O roxo da marca (${BRAND}) marca o que está selecionado: card em foco, menu ativo, links e botões. Um estilo nesse roxo parece "selecionado". Lilás puxado para o rosa (malva) ou bem claro funciona.`,
  },
  {
    title: 'Contraste do texto',
    text: 'O nome do estilo vai escrito em cima da cor. Amarelo, laranja e cores claras só funcionam com texto escuro; o teste de acessibilidade do app (WCAG AA) pede contraste de 4,5:1 e reprova o resto.',
  },
  {
    title: 'Tema escuro',
    text: 'O fundo do tema escuro é azul-marinho. Preto, azul-noite e chumbo quase somem nele e precisam de uma versão mais clara, ou de texto colorido (como o dourado do Afro).',
  },
  {
    title: 'O limite do Google Agenda',
    text: `O calendário do Pas de Deux só tem as 11 cores de evento do Google (${Object.keys(GOOGLE).join(', ')}), sem tons. O app pode usar a mesma família de cor com tons diferentes por estilo: continua "sincronizado" para quem olha os dois, e cada estilo fica distinguível.`,
  },
]

/**
 * Página de teste (/lab/genre-colors, pública mas sem link no app): seis paletas de cor para os
 * estilos, com prévia dos filtros e dos cards nos dois temas, o motivo de cada cor e o que não
 * funciona no app. Só para escolher: o app continua com src/domain/genres.ts.
 */
export default function GenreColors() {
  useDocumentHead({
    title: 'Cores dos estilos (teste)',
    description: 'Paletas de cor para os estilos de dança',
    canonical: `${siteUrl()}test/genre-colors`,
    noindex: true,
  })
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <BackToTest />
      <header className="space-y-3">
        <h1 className="text-2xl font-bold">Cores dos estilos</h1>
        <p>
          Nove paletas para os estilos de dança, para comparar: a que o app usava até 27/11, a sugerida pelo Terça (Pas de Deux), uma pelos
          motivos dele, uma por como os estilos são vistos, uma pelas cores mais associadas e a minha sugestão e uma nova proposta com cores
          escolhidas, mais a versão final (a que o app usa agora) e a tradução dela para o Google Agenda. Cada uma mostra os filtros e
          alguns cards nos temas claro e escuro, o motivo de cada cor e o que não funciona no app.
        </p>
        <nav aria-label="Paletas" className="flex flex-wrap gap-2 text-sm">
          {PALETTES.map((palette) => (
            <a
              key={palette.id}
              href={`#${palette.id}`}
              className="rounded-xl border-2 border-border px-3 py-1 font-bold text-brand hover:bg-surface-muted"
            >
              {palette.name.replace(/ \(.*\)$/, '')}
            </a>
          ))}
        </nav>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Famílias</h2>
        <p className="text-sm">
          Latinas, Afro e BR continuam iguais. <strong>American</strong> e <strong>Salão</strong> são novas (já no app); Tradicionais fica
          sozinha. A família é o conjunto do filtro (o chip de cantos retos, que marca todos os estilos dela).
        </p>
        <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {FAMILIES.map((family) => (
            <li key={family.id}>
              <Card className="h-full space-y-1">
                <h3 className="font-bold">{family.umbrella ?? family.name}</h3>
                <p>{family.genres.join(', ')}</p>
                {family.note && <p className="text-fg-muted">{family.note}</p>}
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Por que certas cores não funcionam no app</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason) => (
            <Card key={reason.title} className="space-y-1">
              <h3 className="font-bold">{reason.title}</h3>
              <p className="text-sm">{reason.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Lado a lado</h2>
        <div className="overflow-x-auto rounded-2xl border-2 border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th scope="col" className="p-2">
                  Estilo
                </th>
                {PALETTES.map((palette) => (
                  <th key={palette.id} scope="col" className="p-2 whitespace-nowrap">
                    {palette.name.split('.')[0]}. {palette.name.replace(/^\d+\. /, '').replace(/ \(.*\)$/, '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FAMILIES.map((family) =>
                [...(family.umbrella ? [family.umbrella] : []), ...family.genres].map((genre, index) => (
                  <tr key={genre} className={index === 0 ? 'border-t-2 border-border' : ''}>
                    <th scope="row" className={`p-2 whitespace-nowrap ${genre === family.umbrella ? 'font-extrabold' : 'font-medium'}`}>
                      {genre}
                    </th>
                    {PALETTES.map((palette) => (
                      <td key={palette.id} className="p-1.5">
                        <GenreChip palette={palette} genre={genre} theme="light" umbrella={genre === family.umbrella} />
                      </td>
                    ))}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>

      {PALETTES.map((palette) => (
        <PaletteSection key={palette.id} palette={palette} />
      ))}
    </div>
  )
}
