# Eventos em SWR

> Versão com diagramas, junto das outras camadas de cache: [`docs/technical/03-cache-and-swr.md`](docs/technical/03-cache-and-swr.md).
> Status: no ar desde 26/11 (branch `data` gerado pela Action **Update SWR**).

*Stale-while-revalidate*: o app mostra **na hora** eventos já prontos (um pouco velhos) e, em paralelo, consulta a
Google Calendar API. Se algo mudou, troca. A pessoa não espera a API para ver a agenda.

## Camadas (do mais rápido ao mais novo)

| Camada | Frescor | De onde | Para quê |
|---|---|---|---|
| **HTML do deploy** (`#initial-events`) | do deploy (diário, 05:00 UTC) | `scripts/prerender.ts`, a partir do cache principal | 1ª janela já no HTML (LCP) |
| **Salvo no aparelho** (query persistida, 24 h) | da última visita | `localStorage` | Abrir offline / voltar |
| **Arquivos do SWR** ✅ | até **2 h** | branch `data`, por `raw.githubusercontent.com` | 1ª janela mais nova que o HTML, antes da API |
| **Google Calendar API** | ao vivo | navegador | Revalidação |
| **`/events-cache.json`** | do deploy | site | Fallback quando a API falha (por calendário) |

## Dois caches com papéis diferentes

### Cache principal (diário): `.cache/events.json` → `/events-cache.json`

- Os 3 calendários de **ontem** a **90 dias à frente** (antes eram 30 dias atrás: ninguém precisava).
- Gerado pela Action **Update data** (05:00 UTC) e antes do build no deploy (`pnpm events:cache`).
- Base dos scripts:
  - `venues:check`;
  - `promoters:update`;
  - `prerender`, que gera as páginas `/event/…`, o sitemap e a 1ª janela no HTML.
- No app, é o fallback de quando a API falha.
- Usa a chave `VITE_GOOGLE_API_KEY_SCRIPTS`.

### Cache do SWR (a cada 2 h): branch `data` → `swr/0.json`, `1.json`, `2.json`

- Os 3 calendários de **ontem** a **14 dias à frente** (15 dias), em **3 arquivos de 5 dias**. Cada arquivo traz
  `{ generatedAt, start, end, items }`. Um evento de vários dias entra em cada arquivo que toca.
- Ontem e mais 14 dias cobrem a 1ª janela da agenda (14 dias a partir de hoje), inclusive de madrugada, quando o
  "hoje" da agenda ainda é ontem (até as 05:00).
- Gerado pela Action **Update SWR** (`.github/workflows/swr.yml`, `pnpm events:swr`):
  - roda a cada 2 h, no minuto 17;
  - publica num branch `data` órfão, com um commit só, substituído a cada vez (o histórico não cresce);
  - não faz deploy;
  - se a API falhar, não publica e fica o arquivo anterior.
- Servido por `raw.githubusercontent.com`, que libera CORS para qualquer site e tem cache de 5 min. A URL fica em
  `src/api/config.ts` (`SWR_URL`; `VITE_SWR_URL` troca ou desliga com `off`; desligado no mock).

## Como o app usa (`src/api/swrEvents.ts`)

1. O loader da agenda (`src/api/eventsLoader.ts`):
   - põe a janela do HTML na query (`seedInitialEvents`);
   - dispara a API (`prefetchInfiniteQuery`);
   - chama `seedSwrEvents`, sem esperar.
2. `seedSwrEvents`:
   - busca os 3 arquivos em paralelo (memorizados por 5 min, porque cada navegação até a agenda chama o loader);
   - monta a janela `[início, início + 14)` com `swrWindow`, só se os arquivos a cobrem inteira, são contíguos e da
     mesma geração;
   - põe a janela na query **só se for mais nova** que o que ela tem: o `dataUpdatedAt` da query é comparado com o
     `generatedAt` dos arquivos;
   - troca só a 1ª página e mantém as outras já carregadas.
3. A janela entra com `updatedAt = generatedAt`. Como passou do `staleTime` (5 min), o TanStack a trata como velha,
   e a resposta da API a substitui. Se a API responder primeiro, os arquivos são ignorados.
4. Se a API falhar, os eventos do SWR ficam na tela.

Na prática:
- **Quem abre o site pela 1ª vez:** HTML do deploy → arquivos do SWR (~100 ms) → API.
- **Quem tem o app instalado e o HTML de dias atrás no service worker:** o HTML não serve, porque a data não bate.
  Os arquivos do SWR mostram a agenda antes da API.
- **`?date=` dentro dos 15 dias:** só se a janela couber inteira. Na prática, só hoje e ontem.

## Próximos passos (não feitos)

- [ ] **Primeiro arquivo como prioridade:** mostrar os 5 primeiros dias assim que o `0.json` chegar, sem esperar o
  `1` e o `2`. Exige marcar a página como parcial, para o feed não achar que os dias 6–14 estão vazios.
- [ ] **Mapa e detalhe do evento:** usar os arquivos para o dia escolhido no mapa e para `/event/<slug>/` de eventos
  dos próximos 15 dias.
- [ ] **Service worker:** `StaleWhileRevalidate` para os arquivos do SWR (abre offline com dados de até 2 h).
- [ ] **Fallback da API pelos arquivos do SWR**, que são mais novos que o `/events-cache.json`, para os primeiros 15
  dias.
- [ ] **Menos chamadas à API no navegador:** com dados de até 2 h, dá para chamar a API só ao rolar além dos 15
  dias, ou com um `staleTime` maior quando os arquivos forem recentes. Isso corta a maior parte do uso da chave no
  site. Decidir com o Pas de Deux quão rápido uma mudança precisa aparecer.
- [ ] **Aviso "Atualizado às…"** quando a API falhar e os dados vierem de um cache.
- [ ] **Página `/lab`** com a idade dos arquivos do SWR, para acompanhar o cron.

## Arquivos

| Arquivo | O quê |
|---|---|
| `scripts/events-swr.ts` | Gera os 3 arquivos (`pnpm events:swr [pasta]`) |
| `.github/workflows/swr.yml` | Cron a cada 2 h e publicação no branch `data` |
| `src/api/swrEvents.ts` | `splitSwrParts`, `swrWindow`, `seedSwrEvents` |
| `src/api/swrEvents.test.ts` | Divisão, montagem da janela e quando a query é (ou não) trocada |
| `src/api/config.ts` | `SWR_URL` |
| `src/api/eventsLoader.ts` | Chama `seedSwrEvents` |
| `scripts/lib/eventsCache.ts`, `scripts/prerender.ts`, `scripts/promoters-update.ts` | Cache principal a partir de ontem |
