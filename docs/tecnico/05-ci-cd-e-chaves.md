# 05. CI/CD e chaves

## Os três workflows

```mermaid
flowchart TB
  PUSH([push na main]) --> DEPLOY
  CRON5([cron 05:00 UTC]) --> DAILY
  CRON2([cron a cada 2 h]) --> SWR
  MANUAL([Run workflow]) -.-> DAILY & SWR

  subgraph DAILY["Update data (daily.yml)"]
    D1[events:cache] --> D2["venues:check 90 --fix"] --> D3[promoters:update] --> D4["commit de venues.json<br/>e promoters.json"]
  end

  subgraph DEPLOY["Deploy (deploy.yml)"]
    P1["format, lint, knip,<br/>testes, e2e + axe"] --> P2["events:cache"] --> P3["build + prerender"] --> P4[GitHub Pages]
  end

  subgraph SWR["Update SWR (swr.yml)"]
    S1["events:swr"] --> S2["force-push<br/>branch data"]
  end

  D4 -->|"workflow_call<br/>(sempre)"| DEPLOY
```

| Workflow | Quando | O que publica | Tempo |
|---|---|---|---|
| **Deploy** | push na `main`; chamado pelo Update data | O site (GitHub Pages) | ~5–10 min |
| **Update data** | 05:00 UTC, ou à mão | Commit de `venues.json`/`promoters.json`, depois o deploy | ~2 min + deploy |
| **Update SWR** | a cada 2 h (minuto 17), ou à mão | Branch `data` (`swr/0–2.json`) | ~1 min |

- **Deploy bloqueado por teste:** se qualquer verificação falhar, inclusive o e2e de acessibilidade, o site não muda.
  Foi o que aconteceu em 25/11, com um link de contraste baixo no tema escuro.
- **Push do bot:** um push feito com o `GITHUB_TOKEN` não dispara outro workflow. Por isso o Update data chama o
  deploy diretamente (`workflow_call`, `secrets: inherit`).

## As chaves do Google

```mermaid
flowchart LR
  subgraph Browser["No navegador (visível no JS)"]
    K1["VITE_GOOGLE_API_KEY<br/>…wOV4<br/>restrita a lisbondance.com"]
  end
  subgraph Actions["Só no GitHub Actions"]
    K2["VITE_GOOGLE_API_KEY_SCRIPTS<br/>sem restrição de domínio<br/>só Calendar API"]
  end
  subgraph Local["Na sua máquina (.env.local)"]
    K3["VITE_GOOGLE_API_KEY<br/>…qUiA (dev)"]
  end

  K1 -->|build| SITE[Site]
  K2 -->|"events:cache, events:swr,<br/>venues, promoters"| SCRIPTS[Scripts]
  K3 --> DEV["pnpm dev e scripts locais"]
```

- **Como os scripts escolhem a chave** (`scripts/lib/app.ts`): se `VITE_GOOGLE_API_KEY_SCRIPTS` existir, ela vira a
  `VITE_GOOGLE_API_KEY` que o código do app lê. Senão, usa a do site. O log mostra qual foi usada (`venues: chave da
  API dos scripts`).
- **Referer:** os scripts mandam `Referer: https://lisbondance.com/` nas chamadas à API. Por isso funcionam até com a
  chave restrita ao domínio. A chave dos scripts existe para não depender disso e para permitir restringir mais a do
  site.
- **Todos os passos do Update data recebem as duas chaves.** Venues e promoters carregam o código do app, que exige
  uma chave com dados reais mesmo lendo só o cache.
- **O build do site recebe só a chave do site.** A dos scripts nunca entra no JavaScript publicado: o código do
  site não a lê, só os scripts Node.

## Secrets e variables (Settings → Secrets and variables → Actions)

| Nome | Tipo | Usado em |
|---|---|---|
| `VITE_GOOGLE_API_KEY` | Secret | Build do site; fallback dos scripts |
| `VITE_GOOGLE_API_KEY_SCRIPTS` | Secret | events:cache, events:swr, venues, promoters |
| `VITE_USE_MOCK` | Variable | `false` = API real no deploy |
| `VITE_GOATCOUNTER_CODE` | Variable | Analytics (`cid360`) |

## Branches

```mermaid
gitGraph
  commit id: "feat…"
  commit id: "Update venues (bot)"
  commit id: "fix…"
  branch data
  checkout data
  commit id: "SWR 10:17 (órfão, force-push)"
  checkout main
  commit id: "docs…"
```

- **`main`:** o código. Todo push dispara o deploy.
- **`data`:** órfão, sem histórico em comum com a `main`. Tem um commit só, substituído a cada 2 h. Nunca é mesclado.
