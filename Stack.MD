# Stack — Lisbon Dance with Pas de Deux

Retrato da stack atual, avaliação da arquitetura e recomendações. Os tamanhos vêm de `pnpm analyze`
(build de produção de 24/11/2026, com o mock); "gz" é o tamanho com gzip.

## 1. Stack atual

| Área | Tecnologia | Papel no projeto |
|---|---|---|
| Framework e renderização | **React 19** (SPA) + **prerender próprio** (`scripts/prerender.ts`) | O app roda no navegador; no build, uma página estática por evento e a agenda com a lista de eventos, para SEO e redes sociais. O React substitui esse HTML ao carregar. |
| Linguagem e tipos | **TypeScript 7** (`tsc -b`, compilador nativo) | Tipagem estrita; `tsc -b` faz parte do `pnpm build`. |
| Build | **Vite 8** (Rolldown) + `@vitejs/plugin-react` | Dev server, build, code splitting por rota (`lazy` do router) e plugin próprio de SEO (`seoFiles` em `vite.config.ts`: sitemap, robots, cópias do `index.html` por rota). |
| Roteamento | **React Router 8** (data router) | Loaders (`eventsLoader` começa a busca antes da página), rotas lazy, `basename` do GitHub Pages, rotas antigas redirecionadas. |
| Dados do servidor | **TanStack Query 5** + `query-sync-storage-persister` | Eventos em janelas de 14 dias (`useInfiniteQuery`), geocodificação, cache persistido no `localStorage` por 24 h (abre offline). |
| Estado do app | **Zustand 5** | Tema, idioma, eventos acompanhados, palavras ignoradas, aviso de instalação (persistidos); seleção/hover de eventos, localização e dia em foco (só memória). |
| Persistência | `localStorage` via `src/lib/storage.ts` (nunca lança) + adaptador `src/lib/persistStorage.ts` | O adaptador grava cada chave no formato que já existia antes do Zustand (texto puro ou JSON sem envelope). Cache do LanguageTool continua no `storage.ts` direto. |
| Estilo | **Tailwind CSS 4** (`@tailwindcss/vite`) + tokens em `src/index.css` | Tema claro/escuro por `data-theme`, cores semânticas, CSS final ~62 KB. |
| UI | Componentes próprios (`src/components/ui`): Button, Card, Chip, BottomSheet (`<dialog>`), Segmented, Tooltip | Sem biblioteca de componentes. |
| Ícones | **@phosphor-icons/react** | Phosphor no peso duotone via `IconContext`. |
| Mapa | **Leaflet 1.9** + **react-leaflet 5** | Carregado só quando o mapa aparece (chunk `EventsMap`, 163 KB / 48 KB gz). |
| Sanitização | **DOMPurify** | HTML da descrição dos eventos (chunk `EventDetails`). |
| PWA | **vite-plugin-pwa 2** (Workbox, `generateSW`, `autoUpdate`) + `workbox-window` | Precache de todo o build, atualização automática, convite de instalação próprio (`src/pwa/installPrompt.ts`, `InstallBanner`). |
| Fontes | **@fontsource-variable** (Nunito e Fredoka, variáveis) | Self-hosted em `src/fonts.css`, só latin e latin-ext (~109 KB), no cache do PWA. |
| Testes | **Vitest 5** + **React Testing Library** (jsdom); **Playwright** + **axe** | Domínio e componentes (`pnpm test`); fluxos e acessibilidade no celular e no desktop (`pnpm e2e`, no CI). |
| Qualidade | **oxlint**, **oxfmt**, **Knip**, husky + lint-staged, `pnpm a11y` (axe-core via Chrome headless) | Lint, formatação, código morto e acessibilidade (WCAG 2.1 AA). |
| Análise de bundle | **rollup-plugin-visualizer 7** (`pnpm analyze`) | Treemap do bundle sob demanda. |
| Deploy | GitHub Pages + GitHub Actions (Update data diário: cache dos eventos, venues, promoters e deploy; Update SWR a cada 2 h no branch `data`) | Sem servidor próprio; a chave da Google Calendar API do site fica no JavaScript publicado (restrita ao domínio) e os scripts usam outra. Camadas de dados: 1ª janela no HTML, query no aparelho, arquivos do SWR (até 2 h), API e o `/events-cache.json` como fallback (ver `docs/technical/03-cache-and-swr.md`). |

### Bundle (build de produção)

| Chunk | Tamanho | gz | Quando carrega |
|---|---|---|---|
| `index` (React, React DOM, Router, Query, Zustand, núcleo do app) | 412 KB | 132 KB | Sempre |
| `EventsMap` (Leaflet) | 163 KB | 48 KB | Quando o mapa aparece |
| `events` (mock) | 52 KB | 13 KB | Só com `VITE_USE_MOCK` |
| `EventDetails` (DOMPurify + detalhes) | 39 KB | 15 KB | Ao abrir um evento |
| `Dance` (agenda) | 32 KB | 10 KB | Rota `/` |
| `Icons` (`/lab/icons`) | 334 KB | 78 KB | Só nessa página interna |

Dentro do `index`, por pacote (soma dos módulos, aproximada): react-dom ≈ 99 KB gz, react-router ≈ 54 KB gz,
código do app ≈ 31 KB gz, query-core ≈ 16 KB gz, Phosphor ≈ 8 KB gz (só os ícones usados), Zustand ≈ 1–3 KB gz.

## 2. Avaliação da arquitetura

**O que funciona bem**

- Divisão clara de estado: servidor no TanStack Query, app no Zustand, navegação na URL (gêneros, data, dia,
  evento aberto). Não há estado duplicado entre eles: o dia do mapa está na URL e o `focusedDayStore` só
  guarda o último dia para restaurar ao trocar de página.
- Code splitting bom: Leaflet, DOMPurify, páginas e área de teste ficam fora do chunk inicial.
- Offline real: cache persistido do Query + precache do Workbox.
- Domínio testado e isolado (`src/domain`), sem dependência de React.

**Limitações**

1. **Primeira carga dominada por react-dom + react-router**: os dois são a maior parte dos 132 KB gz do
   `index`. É o custo base da stack; não há gordura óbvia no código do app.
2. **Fontes externas bloqueiam a renderização**: dois pedidos a domínios do Google antes do primeiro texto,
   com 8 pesos no total. Também dependem de rede no PWA offline (o Workbox só faz precache dos arquivos do build).
3. **Prerender próprio**: funciona, mas é código a manter (template, JSON-LD, sitemap) e duplica parte do que
   o React Router em modo framework faria.
4. **Testes só de unidade**: interação (faixa de dias centrada, deslize do calendário, rolagem por dia,
   restauração do dia entre páginas) só é verificada à mão ou por scripts CDP ad hoc. São justamente as partes
   que mais quebraram (ver histórico do `git log`).
5. **Cache persistido no `localStorage`** (síncrono, ~5 MB, serializa tudo a cada mudança). Hoje cabe com
   folga (janelas de 14 dias, 24 h de validade), mas cresce com cada data buscada.
6. **Barra de status do iOS**: `apple-mobile-web-app-status-bar-style` é `black-translucent` (texto branco sobre
   o app) e o header no tema claro agora é branco: no app instalado no iPhone, o relógio/bateria podem ficar
   invisíveis no tema claro. Precisa de conferência num aparelho.

**Dependências redundantes ou sobrepostas**

- **`@tanstack/react-query-devtools`** já é só de desenvolvimento e só com `?devtools`: ok.
- `workbox-window` parece sem uso (nenhum import), mas é usado pelo `virtual:pwa-register` do vite-plugin-pwa:
  manter.

## 3. Stack recomendada

| Manter | Por quê |
|---|---|
| React 19, TypeScript, Vite 8 | Base atual, sem dor. |
| TanStack Query | Paginação infinita, cache, persistência offline e retry já resolvidos. |
| Zustand | Pequeno (≈1 KB gz), sem provider, funciona fora do React (handlers do mapa, testes) e o `persist` permitiu manter os formatos salvos. |
| Tailwind 4, componentes próprios | Sem custo de runtime; os componentes são poucos e específicos. |
| Leaflet | Mais leve que MapLibre GL (que exigiria WebGL e tiles vetoriais) para pinos sobre tiles do OSM. |
| DOMPurify | Necessário: a descrição vem de um calendário público. Já é lazy. |
| vite-plugin-pwa | Padrão para Vite; o `generateSW` cobre o caso. |
| oxlint / oxfmt / Knip | Rápidos e já no CI. |

| Trocar ou acrescentar | Benefício | Custo / risco | Complexidade |
|---|---|---|---|
| **Fontes self-hosted** (`@fontsource-variable/nunito`, `@fontsource/fredoka`, só os pesos usados, `font-display: swap`) | Sem bloqueio por domínios externos, fontes no precache (offline de verdade), menos pedidos | Fontes entram no build (+~60–90 KB woff2, em cache) | Baixa |
| **Testes de componente**: `@testing-library/react` (o `jsdom` já está nas devDependencies) | Cobrir `DayShortcuts`, `WeekStrip`, `CalendarPicker` e os stores com DOM | Configurar ambiente `jsdom` por arquivo | Baixa |
| **Playwright** para fluxos e2e (substituindo os scripts CDP de verificação; o `a11y` poderia usar `@axe-core/playwright`) | Regressões de rolagem, deslize, centralização e PWA pegas no CI | Navegadores no CI (+1–2 min) | Média |
| **Persister assíncrono em IndexedDB** (`@tanstack/query-async-storage-persister` + `idb-keyval`) | Sem limite de 5 MB nem serialização síncrona na thread principal | Hidratação assíncrona (o app já espera o `PersistQueryClientProvider`) | Média — só quando o cache crescer |
| **React Router em modo framework com `prerender`** | Substitui `scripts/prerender.ts` e o plugin `seoFiles` por recurso mantido pelo router | Migrar rotas para `routes.ts` e o build | Alta — longo prazo |

**Não recomendado agora**

- **Preact/compat** para reduzir o react-dom: economizaria ~90 KB gz, mas React 19 (`use`, Actions, novas APIs
  de `ref`) e bibliotecas como react-leaflet não têm compatibilidade garantida.
- **TanStack Router / wouter** no lugar do React Router: ganho de tamanho real (wouter) ou de tipos (TanStack),
  mas os loaders, rotas lazy e redirecionamentos atuais teriam de ser reescritos sem problema concreto a resolver.
- **Biblioteca de componentes** (Radix, shadcn): os poucos componentes próprios já usam `<dialog>` nativo e
  cumprem WCAG AA (verificado com `pnpm a11y`).
- **Next.js / Astro**: o deploy é estático no GitHub Pages e o app é interativo; SSR não traz ganho que o
  prerender atual não traga.

## 4. Recomendações priorizadas

**Imediatas (baixo custo, ganho claro)**

1. Conferir a barra de status do PWA no iPhone com o header branco; se o texto sumir, usar
   `apple-mobile-web-app-status-bar-style="default"` (ou voltar o header do tema claro para uma cor escura).
2. ~~Fontes self-hosted com só os pesos usados (melhora LCP e o offline).~~ Feito em 24/11.
3. ~~Testes de componente para a navegação por dias e para os stores persistidos.~~ Feito em 24/11.
4. Rodar `pnpm analyze` antes de adicionar dependências ao chunk inicial (o `index` hoje tem 132 KB gz).

**Médio prazo**

5. ~~Playwright para os fluxos críticos (agenda ↔ mapa, calendário, detalhes, instalação), rodando no CI.~~ Feito em 24/11.
6. Persister em IndexedDB quando o cache de eventos passar de ~1 MB (o mapa agora busca datas avulsas).

**Longo prazo**

7. Avaliar o modo framework do React Router com `prerender` para aposentar o prerender próprio, se ele
   começar a exigir manutenção (novos tipos de página, i18n por URL).
