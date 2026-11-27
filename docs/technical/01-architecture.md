# 01. Arquitetura

Um **PWA estático**: React 19 + Vite, sem servidor próprio. Os eventos vêm da Google Calendar API (no navegador) e de
arquivos JSON gerados por GitHub Actions. O site é publicado no GitHub Pages.

## Camadas do código

```mermaid
flowchart TB
  subgraph UI["Interface (src/pages, src/features, src/components)"]
    PAGES["Páginas<br/>Dance, MapPage, Community, Info, test/*"]
    FEAT["Features<br/>events, dates, genres, map, location, tracking, price"]
    COMP["Componentes<br/>Header, Sidebar, BottomNav, ui/*"]
  end

  subgraph State["Estado"]
    RQ["TanStack Query<br/>eventos, geocodificação"]
    ZS["Zustand<br/>tema, idioma, eventos acompanhados, foco"]
    URL["URL<br/>?date=, ?genres=, /event/slug/"]
  end

  subgraph Data["Dados (src/api)"]
    LOADER[eventsLoader]
    QUERIES[queries.ts]
    GCAL[googleCalendar.ts]
    CACHE["eventsCache.ts<br/>swrEvents.ts<br/>initialEvents.ts"]
  end

  subgraph Domain["Regras (src/domain)"]
    PARSE["parseSummary, parseGenres<br/>preço, promotores, slug"]
  end

  PAGES --> FEAT --> COMP
  FEAT --> RQ & ZS & URL
  RQ --> QUERIES --> GCAL
  LOADER --> QUERIES & CACHE
  GCAL --> CACHE
  QUERIES --> PARSE
```

| Pasta | O quê |
|---|---|
| `src/api` | Busca dos eventos (API, mock, caches), configuração e o `QueryClient` |
| `src/domain` | Regras puras: título → estilos, preço, local, promotores, slug, calendários |
| `src/features` | Cada funcionalidade com seus componentes e hooks (eventos, datas, estilos, mapa…) |
| `src/pages` | As rotas (carregadas sob demanda) |
| `src/seo` | `<head>` de cada página e a geração das páginas estáticas |
| `src/analytics` | GoatCounter, cliques marcados e recorrência de visitas |
| `src/i18n` | Português e inglês |
| `scripts/` | Scripts Node que usam o código do app (cache, SWR, prerender, venues, promoters) |

## Rotas

```mermaid
flowchart LR
  ROOT["/ (AppLayout)"] --> DANCE["dance (loader: eventsLoader)"]
  DANCE --> AGENDA["/ — agenda"]
  DANCE --> EVENT["/event/:slug/ — detalhes"]
  ROOT --> MAP["/map — mapa (celular)"]
  ROOT --> COMM["/community"]
  ROOT --> ABOUT["/about"]
  ROOT --> SCHOOLS["/schools"]
  ROOT --> REVIEW["/review (sem link)"]
  ROOT --> TEST["/lab/* (sem link, noindex)"]
  ROOT -.-> LEGACY["/evento, /mapa, /info… → redirecionam"]
```

- A agenda e o detalhe do evento são **a mesma página** (rota pai `dance`): abrir e fechar um evento não remonta a
  lista.
- Todas as páginas são `lazy`: o JavaScript inicial tem só o framework, o layout e o roteador.
- O `eventsLoader` roda antes da página. Ele:
  - decide o dia inicial (`?date=` ou "hoje", que até as 05:00 ainda é ontem);
  - põe os eventos que já existem na query (HTML e SWR);
  - dispara a API.

## Do clique ao card

```mermaid
sequenceDiagram
  autonumber
  participant U as Pessoa
  participant R as Router
  participant L as eventsLoader
  participant Q as TanStack Query
  participant F as EventFeed

  U->>R: abre lisbondance.com
  R->>L: loader da rota "dance"
  L->>Q: seedInitialEvents (HTML)
  L->>Q: prefetch da API (não espera)
  L->>Q: seedSwrEvents (não espera)
  R->>F: renderiza a página
  F->>Q: useInfiniteQuery(['events', hoje])
  Q-->>F: dados do HTML (na hora)
  Q-->>F: dados do SWR (se mais novos)
  Q-->>F: dados da API (substitui)
  U->>F: rola até o fim
  F->>Q: fetchNextPage (+14 dias, pela API)
```

## Estado

| Onde | O quê | Persistido? |
|---|---|---|
| TanStack Query | Janelas de eventos (`['events', início]`), geocodificação | Sim, `localStorage`, 24 h (`queryClient.ts`) |
| Zustand | Tema, idioma, eventos acompanhados, aviso de instalação | Sim, `localStorage` (`persistStorage.ts`) |
| Zustand (`eventFocus`) | Card em foco / hover (lista ↔ mapa) | Não |
| URL | Dia (`?date=`), estilos (`?genres=`), evento aberto | Na própria URL (links compartilháveis) |

## Hospedagem

```mermaid
flowchart LR
  DNS["Dynadot DNS<br/>lisbondance.com"] --> GHP["GitHub Pages<br/>HTTPS, max-age=600"]
  GHP --> HTML["index.html, event/*/index.html,<br/>404.html (SPA), sitemap.xml"]
  GHP --> ASSETS["/assets/*.js, *.css, fontes"]
  GHP --> JSON["/events-cache.json"]
  RAW["raw.githubusercontent.com<br/>branch data, max-age=300"] --> SWRF["swr/0.json, 1.json, 2.json"]
```

- **GitHub Pages:** não permite cabeçalhos próprios, então todo arquivo tem cache HTTP de 10 min. O service worker
  compensa a partir da segunda visita (ver [06](06-pwa-and-offline.md)).
- **Rotas sem página estática** (ex.: `/lab/...`): o GitHub Pages responde com o `404.html`, que é o próprio app, e o
  roteador assume.
