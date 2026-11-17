# Plano — Eventos de Dança (PWA)

Plano de implementação com base nos arquivos de `docs/prototypes/` e `src/mocks/`.

## 1. O que temos

### Protótipos (`docs/prototypes/Regular.jpeg` e `Dark.jpeg`)

App **"Eventos Futuros"**: agenda de eventos de dança, em tema claro (teal) e escuro (azul-marinho), com 4 breakpoints:

| Breakpoint | Layout |
|---|---|
| **Mobile 375px** | Header com título + ícone de filtros · atalhos de dia (Ontem / Hoje / Amanhã / data) · faixa da semana com ícone de calendário · painel "Filtro Ativo" com chips de gênero · lista de cards · bottom nav (Dança, Escolas, Info) |
| **Tablet 768px** | Igual ao mobile, com mais espaço |
| **Desktop 1280px** | 3 colunas: sidebar (atalhos de dia, filtros, navegação) · grade de cards em 2 colunas · mapa com pinos dos eventos |
| **Large 1920px+** | Igual ao desktop, mas a sidebar mostra a navegação em árvore (Dança → Bachata, Salsa, Kizomba…) |

**Card de evento:** título, local, horário (`20:30 - 01:00`), chips de gênero coloridos, distância (`8.1KM`), ícone "adicionar ao calendário" e seta para expandir.

> As telas foram geradas por IA, por isso há textos sem sentido ("Sens", "Sog", "Tor", "Srilocita", "Filhe Atixe"), itens duplicados ("Dança" aparece duas vezes na sidebar do 1920px) e o chip `+18`, que não existe. **Use-as como referência de layout e posicionamento, não de conteúdo nem de medidas: textos e tags vêm sempre do `events.json`, e espaçamentos e tamanhos de texto seguem os "Padrões visuais".**

### Mock (`src/mocks/events.json`)

É uma exportação da **Google Calendar API v3** (`calendar#events`) com **37 eventos** entre 29/06 e 03/08/2026, fuso `Europe/Lisbon`.

- O `summary` segue o padrão **`Estilo • Nome • Preço`** (o preço é opcional). Exemplos:
  - `Kizomba • Festa Mirage • Pago`
  - `SBK • Festa na Aerlis • 7€ (4€ Sócios)`
  - `Salsa & Bachata • Latin Fiesta • 10€`
- Estilos encontrados: Kizomba (13), SBK (5), Salsa (5), Swing (4), Salsa & Bachata (2), Forró (2), West Coast Swing, Afro-Latinas, Vários, Samba de Gafieira, Fusão, Bachata.
- `start`/`end` vêm como `dateTime` (evento com hora) ou `date` (evento de dia inteiro: 3 festivais).
- `location` é texto livre (34 de 37 têm local), **sem coordenadas**.
- `description` tem HTML/links (Instagram, Linktree, venda de ingressos).
- 15 eventos são ocorrências de eventos recorrentes (`recurringEventId`).

### Diferenças entre protótipo e dados

| Protótipo mostra | Situação nos dados | Decisão sugerida |
|---|---|---|
| Distância (`8.1KM`) e mapa com pinos | Não há coordenadas | Criar `src/data/venues.json` com lat/lng por local (geocodificar uma vez) + geolocalização do usuário. Locais novos que vierem da API e não estiverem na tabela ficam sem pino e sem distância |
| Aba **Escolas** | Não há dados | Página "Em breve" por enquanto |
| Hoje = data atual | A API busca a partir de hoje, de 2 em 2 semanas; o mock é de jun–ago/2026 | Com a API, nada a fazer. Em modo mock, a data inicial é o primeiro evento do arquivo |
| Tags inventadas (Srilocita…) | A tag é o 1º trecho do `summary` | O 1º trecho passa pelo `ALIAS` e vira gêneros da lista `GENRES` (ver "Parser de gêneros") |

### ⚠️ Atenção antes de publicar

- ~~O mock tinha e-mails pessoais (`creator.email`)~~: removidos no passo 0.
- As imagens do protótipo ficam em `docs/prototypes/`, fora do build.

## 2. Arquitetura proposta

```
src/
  domain/
    event.ts            # tipo DanceEvent + normalização
    genres.ts           # GENRES, ALIAS e cor de cada gênero
    parseGenres.ts      # 1º trecho do summary → Genre[]
    parseSummary.ts     # "Estilo • Nome • Preço" → { genres, rawTag, title, price }
  data/
    googleCalendar.ts   # fetchEvents({ timeMin, timeMax }): API real ou mock (VITE_USE_MOCK)
    queries.ts          # eventsInfiniteQueryOptions(startDate) — janelas de 14 dias
    queryClient.ts      # QueryClient com staleTime/gcTime padrão
    venues.json         # coordenadas por texto de location
  features/
    events/
      EventCard.tsx
      EventList.tsx
      DayShortcuts.tsx  # Ontem / Hoje / Amanhã / data
      WeekStrip.tsx     # faixa de dias + abrir calendário
      StyleFilter.tsx   # chips "Filtro Ativo"
      useEventFilters.ts# estado em URL search params (?date=…&genres=…)
    map/
      EventsMap.tsx
  components/           # Header, BottomNav, Sidebar, Chip, ThemeToggle…
  pages/
    Dance.tsx           # rota "/" — eventos
    Schools.tsx         # rota "/escolas"
    Info.tsx            # rota "/info" (substitui About)
  mocks/
    events.json         # mesma forma da resposta da API
```

**Modelo normalizado:**

```ts
type DanceEvent = {
  id: string
  title: string            // "Festa Mirage"
  genres: Genre[]          // ['Kizomba']
  rawTag: string           // "Kizomba" — texto original, para exibir quando genres = []
  price?: string           // "7€ (4€ Sócios)"
  start: Date
  end: Date
  allDay: boolean
  venue?: { name: string; address: string; lat?: number; lng?: number }
  description?: string     // HTML sanitizado
  links: string[]          // extraídos da description
  calendarUrl: string      // htmlLink do Google
}
```

A UI só conhece `DanceEvent`. A troca entre mock e API acontece só em `googleCalendar.ts`.

### Busca de dados — Google Calendar API + TanStack Query

**Fonte:** calendário público `pasdedeux.pt@gmail.com`, endpoint de eventos da Calendar API v3:

```
GET https://www.googleapis.com/calendar/v3/calendars/pasdedeux.pt@gmail.com/events
    ?key=…&singleEvents=true&orderBy=startTime
    &timeMin=<início da janela>&timeMax=<início da janela + 14 dias>
```

- `singleEvents=true` expande os recorrentes em ocorrências (como no mock) e permite `orderBy=startTime`.
- Trocar `clients6.google.com` (endpoint interno usado pelo widget do Google Agenda) pelo endpoint público `www.googleapis.com`, que é o documentado.
- Paginação: se vier `nextPageToken`, buscar as páginas seguintes (ou `maxResults=2500`).
- `sanitizeHtml` não é um parâmetro documentado da API pública e foi deixado de fora. A `description` é HTML vindo de terceiros: sanitizar no cliente (ex.: DOMPurify) antes de renderizar, no passo 4.

**Chave da API:**
- Usar uma chave **própria**, criada no Google Cloud com só a Calendar API habilitada e restrita por *HTTP referrer* a `carloshrabelo.github.io/*` e `localhost:*`.
- Ler de `import.meta.env.VITE_GOOGLE_API_KEY`: `.env.local` em dev e *secret* do GitHub Actions no deploy. A chave acaba no bundle de qualquer forma (é front-end), mas fica fora do git e pode ser trocada sem commit. A restrição por referrer é o que a protege.

**TanStack Query (`@tanstack/react-query`):**
- **Janelas de 2 semanas com `useInfiniteQuery`/`useSuspenseInfiniteQuery`:**
  - Primeira página: data inicial 00:00 (hora de Lisboa) → +14 dias. A data inicial é hoje, ou o dia escolhido em `?date=`.
  - Ao chegar ao fim da lista, busca a próxima janela de 14 dias (`getNextPageParam = início da última janela + 14 dias`) e adiciona os eventos no fim.
  - Detecção do fim: um elemento sentinela no fim da lista observado por `IntersectionObserver` (com `rootMargin` de ~600px, para começar a buscar antes de o usuário chegar lá) chama `fetchNextPage()`. Também há um botão "Carregar mais 2 semanas" como alternativa acessível e para quando o observer não dispara.
  - Fim do feed: `hasNextPage = false` depois de **2 janelas seguidas sem eventos**. Aí a lista mostra "Sem mais eventos por enquanto".
  - Não confundir com o `nextPageToken` do Google: esse é a paginação **dentro** de uma janela e continua sendo tratado em `fetchEvents`.
  - Eventos que cruzam a fronteira entre duas janelas (festivais de vários dias) podem vir nas duas. Remover duplicados por `id` ao juntar as páginas.
- `queryKey: ['events', startDate]`, `staleTime: 5 min`, `refetchOnWindowFocus: true`. `maxPages` não é usado: as janelas já carregadas ficam na lista.
- Integração com o React Router: o `loader` da rota chama `queryClient.prefetchInfiniteQuery(eventsInfiniteQueryOptions(startDate))` **sem `await`** e os componentes usam `useSuspenseInfiniteQuery` com as mesmas opções. Só a primeira janela é buscada no loader. A busca começa junto com a navegação, mas a página abre na hora: o layout aparece completo e só as áreas que dependem da API mostram skeleton. O cache evita refazer a busca.
- **Lista contínua por dia:** a lista é um feed agrupado por dia (cabeçalho "Sábado, 11/07"), a partir da data inicial. Escolher um dia (Ontem / Hoje / Amanhã / faixa da semana / calendário) muda a data inicial e começa um feed novo a partir dali (nova `queryKey`). Se o dia já estiver carregado no feed atual, só rola até ele, sem nova requisição.
- Trocar de filtro de gênero só filtra no cliente, sem nova requisição. Se o filtro deixar a tela com poucos eventos, o sentinela continua visível e as próximas janelas são buscadas sozinhas, até o limite de fim do feed.
- Normalização (`toDanceEvent`) dentro do `select` da query.
- `@tanstack/react-query-devtools` só em dev.
- Offline: `@tanstack/react-query-persist-client` + `localStorage`, para abrir com os últimos eventos sem internet.

### Estados de carregamento — skeletons

Tudo que **não** depende da API aparece imediatamente: header, título, navegação (BottomNav/sidebar), atalhos Ontem/Hoje/Amanhã e a faixa da semana. Só os elementos que dependem dos eventos mostram skeleton:

| Elemento | Skeleton | Observação |
|---|---|---|
| `EventCard` / `EventList` | `EventCardSkeleton` repetido (4 no mobile, 6 em `xl+`, em 2 colunas) | Mesma altura e espaçamento do card real: barra do título, linha do local, linha do horário e 2–3 pílulas de chip |
| Painel "Filtro Ativo" (chips de gênero) | 5–6 pílulas cinzas de larguras variadas | Os chips vêm dos gêneros presentes nos eventos |
| Árvore de gêneros na sidebar (`2xl`) | 5 linhas curtas | Mesma origem dos chips |
| Mapa (`xl+`) | Retângulo com a cor de fundo do mapa | Os tiles carregam à parte. Os pinos só entram quando os eventos chegam |
| Próxima janela (fim da lista) | 2 `EventCardSkeleton` abaixo do último card enquanto `isFetchingNextPage` | Não substitui a lista: os eventos já carregados continuam visíveis |
| Distância no card | Pílula curta no lugar de `8.1KM` | Depende da geolocalização, não da API: o resto do card já aparece |

**Regras:**
- **Um componente base `Skeleton`** em `src/components/Skeleton.tsx` (`animate-pulse`, cor de superfície do tema, cantos arredondados), usado para montar os outros. Funciona nos temas claro e escuro.
- **Sem pulo de layout:** cada skeleton tem as mesmas dimensões do conteúdo real, para nada se mexer quando os dados chegam.
- **Fronteiras de `Suspense` por região**, não uma para a página inteira: lista, filtros e mapa têm cada um o seu `<Suspense fallback={<…Skeleton />}>` e aparecem quando os dados chegam.
- **Só no primeiro carregamento.** Quando já há dados no cache (troca de dia, refetch em segundo plano, volta para a aba), não mostra skeleton. Ao buscar a próxima janela, só aparece o skeleton no fim da lista. Ao trocar a data inicial (nova `queryKey`), usar `useTransition` para manter a lista anterior visível enquanto o feed novo carrega.
- **Acessibilidade:** a região que carrega recebe `aria-busy="true"` e um texto só para leitor de tela ("Carregando eventos…"). Os skeletons têm `aria-hidden`. Respeitar `prefers-reduced-motion` (sem pulsar).
- **Erro:** o `ErrorBoundary` de cada região troca o skeleton por uma mensagem com botão "tentar de novo" (`reset` + `refetch`), sem derrubar a página.
- **Ver os skeletons com o mock:** `VITE_MOCK_DELAY_MS` (ex.: `1500`) faz o mock esperar antes de responder. Sem a variável, o mock responde na hora.

### Padrões visuais — espaçamento, texto e tamanhos

O protótipo foi gerado por IA e não segue uma escala consistente. Ele serve como referência de **layout e posicionamento** (o que fica onde em cada breakpoint), não de medidas. **Não é pixel perfect.** Os valores abaixo são o padrão do app, todos dentro da escala padrão do Tailwind (base de 4px). Valores arbitrários (`p-[13px]`, `text-[15px]`) não devem ser usados.

**Espaçamento** — usar só estes passos:

| Token Tailwind | px | Uso |
|---|---|---|
| `1` | 4 | Entre linhas de texto dentro do card (título → local → horário) |
| `2` | 8 | Entre chips; entre ícone e texto; entre o texto do card e a linha de chips |
| `3` | 12 | Entre cards no mobile; padding interno de chips grandes e botões |
| `4` | 16 | Padding do card; margem lateral da página no mobile; espaço entre blocos (atalhos de dia → faixa da semana → filtros → lista) |
| `6` | 24 | Margem lateral a partir de `md`; espaço entre seções; gap entre colunas em `xl+` |
| `8` | 32 | Margem lateral a partir de `xl`; topo da página no desktop |

**Tipografia** — fonte do sistema (`font-sans` do Tailwind), sem fonte externa: carrega na hora e funciona offline. Uma família só; o título com serifa do protótipo é artefato da IA.

| Papel | Classe | Tamanho / altura de linha | Peso |
|---|---|---|---|
| Título da página ("Eventos Futuros") | `text-2xl` | 24 / 32 | `font-semibold` |
| Cabeçalho de dia no feed ("Sábado, 11/07") | `text-sm` | 14 / 20 | `font-semibold`, cor secundária |
| Título do card | `text-lg` | 18 / 28 | `font-semibold` |
| Local, horário, preço, itens da sidebar | `text-sm` | 14 / 20 | `font-normal` |
| Chips, rótulos da bottom nav, distância | `text-xs` | 12 / 16 | `font-medium` |

- Nada abaixo de 12px.
- No máximo 2 linhas no título do card (`line-clamp-2`) e 1 no local (`truncate`).
- Horários e distâncias com `tabular-nums`, para os números alinharem.

**Tamanhos e formas:**

| Elemento | Tamanho |
|---|---|
| Header mobile | altura 56px (`h-14`) |
| Bottom nav | altura 64px (`h-16`) + `safe-area-inset-bottom` |
| Área de toque mínima (botões, itens de nav, dias da semana) | 44 × 44px |
| Chip de gênero | altura 28px (`h-7`), `px-3`, `rounded-full`. Chip clicável no filtro: 32px (`h-8`) |
| Ícones | 20px em linha com texto (`size-5`), 24px na navegação (`size-6`) |
| Card | `rounded-xl` (12px), `p-4` |
| Painéis (filtros, popup do mapa) | `rounded-2xl` (16px), `p-4` |
| Botões | `rounded-lg` (8px), altura 44px |
| Sidebar (`xl+`) | largura 288px (`w-72`) |
| Coluna do mapa | 360px em `xl`, 480px em `2xl` |
| Card | largura mínima 300px; em `xl+` a grade usa `grid-cols-2` com `gap-4` |

**Elevação:** tema claro usa `shadow-sm` nos cards e `shadow-md` em painéis flutuantes. Tema escuro não usa sombra: usa uma superfície um tom mais clara + borda sutil (`border-white/10`).

### Parser de gêneros (`src/domain/genres.ts` + `parseGenres.ts`)

Os gêneros são uma **lista fechada** (`GENRES`). A tag do evento (1º trecho do `summary`) passa pelo `ALIAS` e depois é comparada com essa lista.

```ts
// src/domain/genres.ts
export const GENRES = [
  'Zouk', 'Forró', 'Salsa', 'Bachata', 'Kizomba', 'Semba',
  'Swing', 'Tango', 'West Coast Swing', 'Bolero', 'Samba',
] as const

export type Genre = (typeof GENRES)[number]

/** Chave = texto da tag (maiúsculas). Valor = gêneros separados por espaço; '' = descartar o texto. */
export const ALIAS: Record<string, string> = {
  'QUEEN KIZOMBA PROJECT': '',
  'RODA DE SAMBA?': '',
  'AFRO-LATINAS': 'SALSA BACHATA KIZOMBA SEMBA',
  'AFRO': 'KIZOMBA SEMBA',
  'PISTA LATINAS': 'SALSA BACHATA',
  'PISTA AFRICANA': 'KIZOMBA SEMBA',
  'SBKZ': 'SALSA BACHATA KIZOMBA ZOUK',
  'SBK': 'SALSA BACHATA KIZOMBA',
  'WCS': 'WEST COAST SWING',
  'WEST COAS SWING': 'WEST COAST SWING', // erro de digitação no calendário
  'ZOUK✅': '',
  'SAMBA DE GAFIEIRA & VÁRIOS': 'SAMBA',
  'SAMBA DE GAFIEIRA': 'SAMBA',
  'FORRO': 'FORRÓ',
  'SWINGADO': '',
  'SHAG': 'SWING',
}

export type GenreColor =
  | 'wine' | 'pink' | 'brown' | 'dark-blue' | 'red' | 'yellow'
  | 'dark-green' | 'light-blue' | 'orange' | 'purple' | 'teal'

export const genreToPalette: Record<Genre, GenreColor> = {
  Bachata: 'wine',
  Bolero: 'pink',
  Forró: 'brown',
  Kizomba: 'dark-blue',
  Salsa: 'red',
  Samba: 'yellow',
  Semba: 'dark-green',
  Swing: 'light-blue',
  Tango: 'orange',
  Zouk: 'purple',
  'West Coast Swing': 'teal',
}
```

**Algoritmo de `parseGenres(tag)`:**

1. Pegar o 1º trecho do `summary` (antes do primeiro ` • `), passar para maiúsculas e tirar espaços nas pontas.
2. Aplicar o `ALIAS` **da chave mais longa para a mais curta**, substituindo o texto inteiro da chave (com limite de palavra). A ordem importa: `AFRO-LATINAS` precisa ser trocado antes de `AFRO`, `SBKZ` antes de `SBK` e `SAMBA DE GAFIEIRA & VÁRIOS` antes de `SAMBA DE GAFIEIRA`.
3. Procurar os nomes de `GENRES` no resultado, **também do mais longo para o mais curto**, removendo cada um que for encontrado. Assim `WEST COAST SWING` vira só West Coast Swing, e não West Coast Swing + Swing: **West Coast Swing e Swing são gêneros diferentes**, e um nunca implica o outro. Os valores do `ALIAS` não podem ser divididos por espaço, porque `WEST COAST SWING` é um gênero só.
4. Remover duplicados e devolver na ordem de `GENRES`.
5. Se nenhum gênero for encontrado, `genres = []`. O card mostra o `rawTag` como chip neutro e o evento só some da lista quando há filtro ativo.

**Resultado com as tags do mock** (simulado com o algoritmo acima):

| Tag no `summary` | Gêneros |
|---|---|
| `Afro-Latinas` | Salsa, Bachata, Kizomba, Semba |
| `SBK` | Salsa, Bachata, Kizomba |
| `Salsa & Bachata` | Salsa, Bachata |
| `Samba de Gafieira` | Samba |
| `Kizomba`, `Salsa`, `Bachata`, `Forró`, `Swing` | o próprio gênero |
| `West Coas Swing` | West Coast Swing (via alias do erro de digitação) |
| `Vários` | — (nenhum) |
| `Fusão` | — (nenhum) |

Tags com erro de digitação que contêm o nome de outro gênero (como `WEST COAS SWING`, que contém `SWING`) precisam de alias próprio. Senão caem no gênero errado.

**Cores:** cada `GenreColor` vira um par de tokens no `@theme` do Tailwind (`--color-genre-wine`, `--color-genre-wine-fg`…), com valores para o tema claro e para o escuro. O contraste do texto sobre o chip precisa passar em AA nos dois temas. Chip sem gênero (`rawTag`) usa um cinza neutro.

## 3. Passo a passo

Cada passo é um commit independente que mantém o app funcionando.

### Passo 0 — Preparar os dados
- [x] Remover `creator`, `organizer` e `etag` do `events.json` (dados pessoais e campos desnecessários).
- [x] Mover as imagens para `docs/prototypes/`.
- [x] Criar `src/data/venues.json`: `{ "<texto do location>": { name, lat, lng } }` para os 16 locais únicos (geocodificados com Nominatim/OpenStreetMap).
- [ ] Criar a chave da API no Google Cloud (restrita por referrer), salvar em `.env.local` como `VITE_GOOGLE_API_KEY` e como *secret* no repositório do GitHub.

**Pronto quando:** nenhum e-mail no repositório, todo `location` do mock tem coordenadas e a chave funciona em `localhost`.

### Passo 0.5 — Camada de dados
- [x] Instalar `@tanstack/react-query` (+ `-devtools` em dev).
- [x] Variáveis de ambiente: `.env.example` (versionado), `.env.local` (local), tipos em `src/env.d.ts` e leitura em `src/data/config.ts` (`USE_MOCK`, `GOOGLE_API_KEY`). Sem `VITE_USE_MOCK`, o padrão é o mock.
- [x] `googleCalendar.ts`: `fetchEvents` com paginação e erro tratado (HTTP ≠ 200 → exceção com mensagem); com `VITE_USE_MOCK=true`, devolve o `events.json`.
- [x] `queryClient.ts` + `QueryClientProvider` no `main.tsx`; `queries.ts` com `eventsInfiniteQueryOptions` (janelas de 14 dias, fim após 2 janelas vazias).
- [x] `fetchEvents({ timeMin, timeMax })` também no mock: filtra o `events.json` pela janela, para o scroll infinito funcionar igual com mock e API.
- [x] `loader` da rota `/` usando `prefetchInfiniteQuery` (sem `await`).
- [x] `VITE_MOCK_DELAY_MS` no mock (e no `.env.example`), para simular a latência da API.
- [x] Workflow de deploy: passar `VITE_GOOGLE_API_KEY` (*secret*) e `VITE_USE_MOCK` (variável do repositório, padrão `true`) para o `pnpm build`.

**Pronto quando:** a página inicial lista os títulos crus vindos da API em dev e no GitHub Pages.

> Feito com o mock: 37 eventos em 5 janelas (29/06 → 07/09), o feed para depois de 2 janelas vazias. Falta validar com a API real quando a chave existir. No GitHub Pages, o mock fica ativo até a variável `VITE_USE_MOCK` do repositório ser `false`.

### Passo 1 — Domínio e parser
- [x] `genres.ts`: `GENRES`, `ALIAS` e `genreToPalette`, como na seção "Parser de gêneros".
- [x] `parseGenres.ts`: algoritmo de 5 passos (alias e gêneros do mais longo para o mais curto).
- [x] `parseSummary.ts`: separa `Tag • Nome • Preço` em `{ genres, rawTag, title, price }`. Sem ` • `, o `summary` inteiro é o título e `genres = []`.
- [x] `event.ts`: transforma o item do Google Calendar em `DanceEvent` (dia inteiro vs. com hora, fuso de Lisboa, venue a partir de `venues.json`).
- [x] Instalar **Vitest** e testar:
  - cada chave do `ALIAS` (incluindo as que viram `''`);
  - ordem: `AFRO-LATINAS` ≠ `AFRO`, `SBKZ` ≠ `SBK`, `WCS` e `West Coas Swing` → só West Coast Swing (nunca Swing); `Swing` → só Swing;
  - maiúsculas/minúsculas e acentos (`Forro` → Forró);
  - os 37 `summary` reais do mock (snapshot).

**Pronto quando:** `pnpm test` passa e o resultado bate com a tabela da seção "Parser de gêneros".

> Feito: 48 testes. A normalização roda no `select` da query, então a UI já recebe `DanceEvent`.

### Passo 2 — Tema e design tokens
- [ ] Aplicar os "Padrões visuais": tipografia, espaçamento e tamanhos. Criar componentes base (`Chip`, `Card`, `Button`, `IconButton`) que já usam esses valores, para as telas não repetirem classes soltas.
- [ ] Trocar `--color-brand` (índigo) pelo teal do protótipo; definir tokens de superfície e texto, e os tokens das 11 cores de `genreToPalette` (fundo + texto, claro e escuro).
- [ ] Tema escuro: seguir o sistema (`prefers-color-scheme`) + seletor manual (Claro / Escuro / Sistema) salvo em `localStorage`. Tailwind v4: `@custom-variant dark` baseado em `data-theme`.
- [ ] Atualizar `theme_color`, `background_color`, nome e ícones do PWA em `vite.config.ts`.

### Passo 3 — Layout responsivo e navegação
- [ ] Rotas: `/` (Dança), `/escolas`, `/info`. Remover `Settings` (o seletor de tema vai para Info ou para o header).
- [ ] `BottomNav` com Dança / Escolas / Info até 1279px.
- [ ] A partir de `xl` (1280px): sidebar com atalhos de dia, filtros e navegação; área central; coluna do mapa.
- [ ] A partir de `2xl`/1920px: navegação em árvore com os gêneros na sidebar.

**Pronto quando:** nos 4 tamanhos, a posição dos elementos corresponde ao protótipo (o que fica onde), usando os "Padrões visuais". Medidas exatas do protótipo não importam.

### Passo 4 — Lista de eventos
- [ ] `EventCard` com título, local, horário, chips, preço e seta que expande (descrição sanitizada com DOMPurify + links).
- [ ] `EventList`: feed agrupado por dia, 1 coluna até `xl`, 2 colunas acima.
- [ ] Scroll infinito: sentinela com `IntersectionObserver` → `fetchNextPage()` (+2 semanas), skeleton no fim enquanto carrega, botão "Carregar mais 2 semanas" e mensagem de fim do feed.
- [ ] `Skeleton` base + `EventCardSkeleton` e `EventListSkeleton`, com as mesmas dimensões do card real (ver "Estados de carregamento").
- [ ] `EventList` dentro de `<Suspense>` + `ErrorBoundary` próprios: skeleton no primeiro carregamento, erro com botão "tentar de novo" e estado vazio ("Nenhum evento nas próximas 2 semanas", com o botão para carregar mais).
- [ ] Botão "adicionar ao calendário": abre o `htmlLink` do Google ou gera um `.ics`.

### Passo 5 — Navegação por data
- [ ] `DayShortcuts` (Ontem / Hoje / Amanhã / data atual).
- [ ] `WeekStrip` com rolagem horizontal, dia selecionado destacado e ícone que abre um seletor de data.
- [ ] Data inicial do feed em `?date=2026-07-11` na URL, para o link ser compartilhável. Sem `?date=`, começa hoje.
- [ ] Escolher um dia já carregado rola até ele; um dia fora do que foi carregado começa um feed novo a partir dele.
- [ ] Ao rolar a lista, o dia destacado na faixa da semana acompanha o cabeçalho de dia visível.
- [ ] Eventos que passam da meia-noite (ex.: 22:00–04:00) aparecem no dia em que começam; festivais aparecem em todos os dias do intervalo.

### Passo 6 — Filtros por gênero
- [ ] Painel "Filtro Ativo" com um chip por gênero de `GENRES` que aparece nos eventos carregados (na cor de `genreToPalette`), selecionáveis, e botão "limpar".
- [ ] Estado em `?genres=salsa,kizomba` (slug do gênero; um evento aparece se tiver **qualquer** gênero selecionado).
- [ ] Ícone de filtros do header abre o painel como *bottom sheet* no mobile.
- [ ] Skeleton de chips no painel de filtros e na árvore de gêneros da sidebar (`2xl`).

### Passo 7 — Mapa e distância
- [ ] **Leaflet + OpenStreetMap** (`react-leaflet`): gratuito, sem chave de API, funciona no GitHub Pages. Tiles escuros (CARTO Dark Matter) no tema escuro.
- [ ] Pinos dos eventos do dia/filtro; clicar no pino destaca o card e vice-versa.
- [ ] Distância: `navigator.geolocation` (com permissão) + fórmula de Haversine. Sem permissão, a distância some.
- [ ] Carregar o mapa com `lazy` apenas em `xl+` para não pesar no mobile. Skeleton do tamanho da coluna enquanto o componente e os eventos carregam.
- [ ] Skeleton curto no lugar da distância enquanto a geolocalização responde.

### Passo 8 — Escolas e Info
- [ ] Escolas: página "Em breve".
- [ ] Info: sobre o projeto, fonte dos dados (calendário comunitário), seletor de tema, botão de instalar o PWA.

### Passo 9 — Qualidade e deploy
- [ ] Acessibilidade: chips como `button`/`aria-pressed`, foco visível, contraste dos chips nos dois temas, `aria-busy` nas regiões carregando e `prefers-reduced-motion` nos skeletons.
- [ ] Conferir com `VITE_MOCK_DELAY_MS=2000` que nenhum elemento pula de lugar quando os dados chegam.
- [ ] Testar offline: o service worker faz cache do app e o persister do TanStack Query guarda os últimos eventos.
- [ ] Script `pnpm venues:check` que lista os `location` vindos da API que ainda não estão em `venues.json`.
- [ ] `pnpm lint && pnpm test && pnpm build` no workflow antes do deploy.

## 4. Decisões

**Tomadas:**
- **Busca de dados**: TanStack Query + Google Calendar API.
- **Geocodificação**: Nominatim (OpenStreetMap).
- **Idioma da interface**: pt-BR. Os textos dos eventos continuam como vêm da API (pt-PT).
- **Janelas da API**: 2 semanas a partir da data inicial, com mais 2 semanas a cada fim de lista (scroll infinito).
- **Lista**: feed contínuo agrupado por dia. Escolher um dia rola até ele, ou começa um feed novo a partir dele se ainda não foi carregado.
- **Fim do feed**: depois de 2 janelas seguidas sem eventos.
- **Filtro de gênero com poucos resultados**: continua buscando as próximas janelas automaticamente, até o fim do feed.
- **Fonte em dev**: mock por padrão (`VITE_USE_MOCK`).

**Em aberto:**
1. **Nome do app**: "Eventos Futuros", como no protótipo, ou outro? (manifest do PWA hoje diz "Meu WebApp")
2. **Chave da API**: criar a chave própria no Google Cloud (até lá, `VITE_USE_MOCK=true`).
3. **Escolas**: existe uma fonte de dados prevista?
4. **Mapa**: OpenStreetMap (recomendado, grátis) ou Google Maps (precisa de chave e faturação)?
