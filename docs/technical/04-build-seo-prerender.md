# 04. Build, SEO e páginas estáticas

O GitHub Pages só serve arquivos. Para buscadores e prévias de link (WhatsApp, Instagram) verem o conteúdo, o build
gera **páginas estáticas** depois do `vite build`: é o *prerender*.

## O build

```mermaid
flowchart LR
  TSC["tsc -b<br/>tipos"] --> VITE["vite build<br/>dist/ com JS, CSS,<br/>service worker"]
  VITE --> PRE["node scripts/prerender.ts"]
  CACHE[(".cache/events.json<br/>ontem → +90 dias")] --> PRE
  PRE --> OUT

  subgraph OUT["dist/"]
    IDX["index.html<br/>+ lista dos próximos eventos<br/>+ initial-events (14 dias)"]
    EV["event/#lt;slug#gt;/index.html<br/>uma por evento"]
    E404["404.html<br/>(o app: rotas sem página)"]
    SM["sitemap.xml<br/>rotas fixas + eventos futuros"]
    LEG["evento/, mapa/, info/…<br/>redirecionam"]
    ECJ["events-cache.json"]
  end
```

- O prerender **usa o código do app no Node**: um servidor do Vite em modo `ssrLoadModule` (`scripts/lib/app.ts`). O
  HTML, o JSON-LD e o sitemap saem das mesmas funções do app (`src/seo/prerender.ts`).
- **Os eventos vêm do cache diário** (no deploy, gerado no passo anterior com a chave dos scripts). Com o mock, vêm do
  mock.

## Página de um evento

```mermaid
flowchart TB
  T["index.html (template)"] --> R["renderEventPage"]
  E["DanceEvent"] --> R
  R --> H["#lt;head#gt;<br/>title, description, canonical,<br/>Open Graph, Twitter,<br/>JSON-LD (schema.org Event)"]
  R --> B["#lt;body#gt;<br/>título, data, local, descrição<br/>(o React substitui ao carregar)"]
```

- **Quem lê:** buscadores e prévias de link leem o `<head>`. A pessoa vê o app, que substitui o conteúdo.
- **Quais eventos ganham página:** só os do período do cache, de ontem a +90 dias. O link de um evento mais antigo
  continua funcionando: o `404.html` abre o app, e o `eventsLoader` leva o feed ao dia do evento.
- **Links antigos** (`/evento/<slug>`): uma página que redireciona para `/event/<slug>/`.

## Sitemap

- Rotas fixas (`/`, `map/`, `community/`, `about/`) e **só os eventos futuros**.
- `lastmod` de cada evento = a última alteração no calendário (`updated` da API, no fuso de Lisboa). Sem ela, a data
  de hoje.

## Primeira janela no HTML

```mermaid
sequenceDiagram
  participant B as Build (prerender)
  participant H as index.html
  participant A as App (navegador)

  B->>H: script JSON initial-events<br/>generatedAt + page (start, end, items)
  A->>H: lê e remove o script (uma vez)
  A->>A: start == dia pedido e query vazia?
  A->>A: setQueryData(updatedAt = generatedAt)
```

Os cards aparecem assim que o JavaScript carrega, sem esperar nenhuma rede. Ver [03](03-cache-and-swr.md).

## O que ainda limita o LCP

O React faz `createRoot().render()`: ele **descarta** o HTML gerado e redesenha. O caminho para o primeiro card já
estar pronto no HTML é renderizar o app no build e **hidratar** (`hydrateRoot`). Os detalhes estão no
`LIGHTHOUSE.md`, na seção "O que falta: LCP".
