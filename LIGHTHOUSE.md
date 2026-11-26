# Lighthouse: diagnóstico e plano

Medição de 24/11/2026 em `https://lisbondance.com/`, perfil **celular** (throttling simulado do Lighthouse 12). Duas
rodadas: uma sem extensões (Chrome headless) e o `lighthouse.json` gerado no navegador, com extensões.

## Resultado

| Categoria | Sem extensões | `lighthouse.json` |
|---|---|---|
| Performance | 78 | 82 |
| Acessibilidade | 100 | 100 |
| Boas práticas | 100 | 96 ¹ |
| SEO | 100 | 100 |

| Métrica | Sem extensões | `lighthouse.json` | Meta ("bom") |
|---|---|---|---|
| First Contentful Paint | 1,7 s | 1,9 s | ≤ 1,8 s |
| **Largest Contentful Paint** | **4,0 s** | **4,0 s** | ≤ 2,5 s |
| **Total Blocking Time** | **370 ms** | **230 ms** | ≤ 200 ms |
| Cumulative Layout Shift | 0 | 0 | ≤ 0,1 |
| Speed Index | 2,1 s | 2,6 s | ≤ 3,4 s |

¹ `errors-in-console`: `ERR_BLOCKED_BY_CLIENT`, o Brave bloqueando o GoatCounter. Não é do site.

> **Ruído do `lighthouse.json`:** foi gerado com extensões ativas. O "JavaScript não minificado" (57 KiB) e quase
> todo o "JavaScript não usado" (304 KiB) são de `chrome-extension://…` (React DevTools e outras). Para medir só o
> site: janela anônima sem extensões, ou `npx lighthouse https://lisbondance.com/`.

## Medição de 26/11 (depois do SWR)

Celular, site publicado, 2 rodadas, depois de: deploy destravado (o e2e de contraste bloqueava desde 25/11), arquivos do
SWR no ar, preconnect com `raw.githubusercontent.com` e o rótulo da faixa de dias corrigido.

| | 24/11 | 26/11 (antes do SWR) | **26/11 (com SWR)** |
|---|---|---|---|
| Performance | 78–82 | 79 | 93–99 (ver correção abaixo) |
| LCP | 4,0 s | 4,7 s | 1,5–1,6 s (ver correção abaixo) |
| TBT | 230–370 ms | 130 ms | 80–250 ms |
| Boas práticas | 96–100 | 96 (404 do SWR no console) | **100** |

## Medição de 26/11, 10:30 (nome novo, 3 rodadas no celular + 1 no desktop)

Depois do deploy com "Lisbon Dance with Pas de Deux" (`de92574`). Mesmo build, mesmas condições:

| Rodada | Performance | FCP | **LCP** | TBT | CLS | Speed Index | Elemento do LCP | Render delay |
|---|---|---|---|---|---|---|---|---|
| Celular 1 | 78 | 2,1 s | **4,5 s** | 150 ms | 0 | 4,0 s | local do 1º card | 3.695 ms |
| Celular 2 | 98 | 1,4 s | **1,4 s** | 130 ms | 0 | 2,5 s | (não informado) | — |
| Celular 3 | 88 | 1,9 s | **3,6 s** | 120 ms | 0 | 1,9 s | local do 1º card | 3.024 ms |
| Desktop | 93 | 0,6 s | 1,7 s | 0 ms | 0,004 | 0,8 s | quadrado do mapa (OSM) | 216 ms |

Acessibilidade, boas práticas e SEO: **100** em todas.

**Correção da medição anterior:** os 93–99 e o LCP de 1,5 s eram a rodada boa de uma variação grande, e não o LCP
resolvido.
- No celular, o LCP varia de **1,4 s a 4,5 s** entre rodadas seguidas.
- Quando fica alto, o elemento é o **texto do 1º card** e quase todo o tempo é *render delay* (3,0–3,7 s): o React
  desenhando a agenda depois do JavaScript. É o mesmo diagnóstico de 24/11.
- **Hipótese para a rodada boa** (não confirmada): o LCP ficou no conteúdo do HTML estático, antes de o React
  substituí-lo. Por isso o Lighthouse não informa o elemento: ele já não existe no fim.
- O caminho continua sendo **renderizar no build e hidratar** (ver "O que falta: LCP").

**Desktop:** o LCP é um quadrado do mapa da coluna lateral (OpenStreetMap, PNG de ~40 KB). O Lighthouse sugere WebP
(economia de ~166–239 KiB) e priorizar essa imagem (~240 ms).
- Os quadrados vêm do servidor do OpenStreetMap, que só serve PNG, então um `<picture>` não resolve.
- A alternativa é trocar o provedor de mapas por um que sirva WebP ou mapas vetoriais. Os principais pedem chave ou
  cadastro.

**Continua sem solução no GitHub Pages:** "Use efficient cache lifetimes", o `max-age=600` (ver "O que não dá para
corrigir no GitHub Pages"). Não tem relação com o SWR.

As camadas de dados estão em `docs/tecnico/03-cache-e-swr.md`.

## Diagnóstico (24/11)

### LCP de 4,0 s (o principal)

O elemento do LCP é o **título do primeiro card** da agenda. Fases: TTFB 666 ms, carregamento 0 ms, **render delay
3.321 ms**. O HTML gerado no build (`scripts/prerender.ts`) já traz a lista dos próximos eventos, mas o app faz
`createRoot(...).render()` (`src/main.tsx`): o React descarta esse HTML e só desenha os cards depois de

1. baixar e executar o JavaScript principal (`index-*.js`, 132 KiB comprimidos, ~650 ms de execução no celular
   simulado), e
2. buscar os eventos na Google Calendar API (3 calendários).

### TBT de 230–370 ms

- `index-*.js`: ~660–880 ms de CPU; *long tasks* de 298 ms e 144 ms logo depois do carregamento.
- ~50 KiB do `index-*.js` não são usados na primeira tela.
- DOM com **2.541 elementos** (14 dias de cards renderizados de uma vez).

### Outros avisos

| Aviso | Detalhe | Corrigível? |
|---|---|---|
| `uses-rel-preconnect` | ~440 ms de economia estimada com preconnect | Sim |
| `modern-image-formats` / `uses-responsive-images` | `src/assets/logo.png`: 36 KiB, PNG 144×120, exibido a 48×40 | Sim |
| `label-content-name-mismatch` | Texto visível ≠ nome acessível (detalhes abaixo) | Sim |
| `render-blocking-insight` | `index-*.css`, ~150 ms | Talvez (CSS crítico inline) |
| `cache-insight` / `uses-long-cache-ttl` | ~300 KiB com cache de 10 min | **Não** no GitHub Pages (abaixo) |

## Aplicado em 24/11

Medido em A/B no mesmo servidor local (`vite preview` do build real), 3 rodadas de cada, celular: o mesmo build
**com** e **sem** os itens abaixo.

| | Performance | LCP | TBT | FCP |
|---|---|---|---|---|
| Antes | 66–69 | 3,9–4,1 s | 320–380 ms | 2,3 s |
| **Depois** | **71–82** | 4,0–4,1 s | **70–180 ms** | 2,4–3,0 s |

O TBT caiu pela metade (os cards são desenhados uma vez, com os dados do HTML, em vez de esperar a API e
renderizar de novo). O LCP **não mudou**: ver "O que falta" abaixo.

### 1. Eventos da primeira janela no HTML ✅

- `scripts/prerender.ts` embute no `index.html` os eventos dos primeiros 14 dias (a primeira janela da agenda), do
  cache dos eventos, num `<script type="application/json" id="initial-events">` (63 eventos, ~86 KB sem compressão).
- `src/api/initialEvents.ts`: `seedInitialEvents` põe esses dados na query do feed antes do `prefetch`
  (`src/api/eventsLoader.ts`), com a data do cache como `updatedAt`. O TanStack Query mostra os cards na hora e
  consulta a API em seguida (dados "velhos"), trocando o que mudou.
- Só vale se o primeiro dia embutido for o que o app pede (HTML de ontem ou `?date=`: ignorado) e se a query
  estiver vazia (o cache do aparelho, mais novo, vence).

### 2. Preconnect com a API ✅

- `index.html`: `<link rel="preconnect" href="https://www.googleapis.com" crossorigin>`.

### 3. Logo ✅

- `src/assets/logo.png` (36 KiB) → WebP em 48, 96 e 144 px de largura (2, 4 e 7 KiB) com `srcset`, no componente
  `src/components/Logo.tsx` (header e sidebar). A de 48 px vai embutida no JavaScript (abaixo do limite do Vite).

### 4. Rótulos acessíveis ✅

- "Outra data": sem `aria-label` (o nome é o texto visível); com a data escolhida, `Seg, 23/11 (Outra data)`.
- Dias da faixa: `20 Sex, Sexta-feira, 20/11` (começa pelo texto visível).
- O título do diálogo do calendário continua "Escolher data".

### 5. JavaScript inicial: sem mudança

- O `index-*.js` (137 KB comprimidos) é quase todo framework: `react-dom`, `react-router` e `@tanstack/query-core`.
  O código do app nele é pequeno, e as páginas já são carregadas sob demanda (`lazy` no `router.tsx`).
- **Testado e desfeito:** a agenda (`pages/Dance`) no pacote inicial, para evitar a segunda leva de requisições
  depois do `index.js`. O `index` foi a 192 KB e ficou **pior** (LCP 4,1–4,2 s, nota 69–78).

### 6. DOM grande: não aplicado

- `content-visibility: auto` nos cards impõe contenção de pintura: corta o anel de destaque do card selecionado
  (`ring-2`) e os tooltips. O ganho seria pequeno (layout inteiro ≈ 150 ms).

### 7. CSS bloqueante: não aplicado

- ~150 ms estimados; fica para depois do LCP.

## O que falta: LCP

O elemento do LCP é o título do primeiro card, e quase todo o tempo é "render delay" (~3,5 s), **mesmo sem esperar a
API**. O HTML gerado já tem a lista dos eventos, mas o app faz `createRoot().render()`: o React descarta esse HTML e
só desenha a agenda depois de baixar e executar o `index.js` e, em seguida, a página da agenda e suas partes (~25
arquivos pequenos), com a CPU e a rede lentas da simulação.

Caminho para baixar o LCP de verdade: **renderizar a agenda no build e hidratar** (`hydrateRoot`), para o primeiro
card já estar no HTML com a aparência final. Opções:

- [ ] `renderToString` do app no `scripts/prerender.ts` (já carrega os módulos pelo Vite), com os dados da primeira
  janela. Cuidados: o que depende do navegador no primeiro render (tema, idioma, `localStorage`, `matchMedia`, layout
  celular × desktop) precisa dar o mesmo resultado no build e no cliente, senão a hidratação diverge.
- [ ] Ou o modo framework do React Router com `prerender` (ver `Stack.MD` e o TODO, seção 12), que resolve rotas,
  dados e hidratação.

## O que não dá para corrigir no GitHub Pages

- **Cache de 10 minutos** em todos os arquivos (`cache-control: max-age=600`), inclusive os com hash no nome, que
  poderiam ter cache de 1 ano. O GitHub Pages não permite mudar os cabeçalhos. Alternativa: Cloudflare na frente
  (DNS na Cloudflare, regra de cache para `/assets/*`). O service worker do PWA já serve esses arquivos do cache
  nas visitas repetidas.

## Como medir de novo

```sh
npx lighthouse https://lisbondance.com/ --view                  # celular (padrão)
npx lighthouse https://lisbondance.com/ --preset=desktop --view
```

Rodar 3 vezes e comparar a mediana: o throttling simulado varia de uma rodada para outra (78 e 82 acima).
