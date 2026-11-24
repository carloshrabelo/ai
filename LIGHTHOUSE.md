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

## Diagnóstico

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
