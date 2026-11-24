# TODO

Tarefas manuais (chaves, configurações, verificações em aparelhos) e ajustes de código pendentes.
Revisado em 24/11/2026: o que foi conferido no site publicado e no repositório está marcado como feito,
com a evidência entre parênteses.

## 0. Prioridade

Itens que afetam o site publicado hoje:

- [ ] **Domínio próprio no SEO** (seção 4): o site responde em `carloshrabelo.dev/ai/`, mas canonical, Open Graph e sitemap apontam para `carloshrabelo.github.io/ai/`, que redireciona (301).
- [ ] **HTTPS obrigatório** (seção 2): `http://carloshrabelo.dev/ai/` responde 200, sem redirecionar para HTTPS.
- [ ] **Barra de status do iPhone** (seção 5): com o header branco, o relógio e a bateria podem sumir no app instalado.

## 1. Chave da Google Calendar API

- [x] Projeto, Google Calendar API ativada e API key criada (o site publicado mostra os eventos reais: só 8 dos 71 títulos do sitemap existem no mock).
- [ ] Conferir as restrições da chave (ela fica visível no JavaScript publicado):
  - *Application restrictions* → **HTTP referrers**: `https://carloshrabelo.dev/ai/*` (domínio atual), `https://carloshrabelo.github.io/ai/*` e, para desenvolvimento, `http://localhost:*/*`. O build das páginas estáticas (`scripts/prerender.ts`) envia o referer do site.
  - *API restrictions* → só **Google Calendar API**.
- [ ] Nunca commitar o `.env.local` (já está no `.gitignore`). Se a chave vazar, gerar outra e apagar a antiga.

## 2. GitHub (Settings do repositório)

- [x] **Pages** com GitHub Actions (deploy de hoje publicado: manifest com as cores novas).
- [x] Secret `VITE_GOOGLE_API_KEY` e variable `VITE_USE_MOCK` = `false` (eventos reais no ar).
- [x] Action **Update venues** e **Update promoters** gravando no `main` (commits do bot de 21 e 22/11).
- [ ] **Pages → Enforce HTTPS** no domínio próprio. Hoje o domínio vem do site do usuário (`carloshrabelo.github.io` → `carloshrabelo.dev`); a opção fica no repositório que tem o *Custom domain*.
- [ ] Conferir se o deploy diário (05:30 UTC) roda sozinho em **Actions → Deploy to GitHub Pages** (não deu para ver pela API pública: limite de requisições).

## 3. Analytics (GoatCounter) — branch `feat/seo-ssg-share-analytics`

A branch foi refeita sobre o `main` (1 commit): o GoatCounter conta as páginas vistas e recebe todos os cliques com `data-track` por um listener só (`connectTrackedClicks`), sem chamadas nos componentes. Desligado sem `VITE_GOATCOUNTER_CODE` e sempre em `pnpm dev`.

- [ ] Publicar a branch refeita: `git push --force-with-lease origin feat/seo-ssg-share-analytics` (a cópia no GitHub é a antiga, de antes do rebase).
- [ ] Criar a conta e o site em [goatcounter.com](https://www.goatcounter.com) (o código é o `<codigo>` de `https://<codigo>.goatcounter.com`).
- [ ] Em **Settings → Secrets and variables → Actions**, criar a variable `VITE_GOATCOUNTER_CODE` com esse código.
- [ ] Fazer o merge da branch: https://github.com/carloshrabelo/ai/compare/main...feat/seo-ssg-share-analytics
- [ ] Depois do deploy, conferir no painel: páginas vistas e eventos como `filters.genre/Salsa`, `event.open/<slug>`, `dates.strip-day/<dia>` (a lista de nomes está em `src/analytics/track.ts`).
- [ ] Decidir se `event.open/<slug>` (um caminho por evento) é o nível de detalhe desejado no painel, ou se basta `event.open`.

## 4. SEO e compartilhamento

- [ ] **`SITE_URL` do domínio próprio**: no `.github/workflows/deploy.yml`, passar `SITE_URL: https://carloshrabelo.dev/ai/` no build. Sem isso, canonical, `og:url`, `og:image`, JSON-LD e `sitemap.xml` usam `carloshrabelo.github.io/ai/` (padrão em `vite.config.ts` quando `GITHUB_PAGES` está definido). Atualizar também o link do README e o `PUBLISHED_URL` de `scripts/lib/app.ts`, se for o caso.
- [ ] **`robots.txt` na raiz do domínio**: `https://carloshrabelo.dev/robots.txt` responde 404 (o site raiz é outro projeto). Criar lá um `robots.txt` com `Sitemap: https://carloshrabelo.dev/ai/sitemap.xml`.
- [ ] [Google Search Console](https://search.google.com/search-console): propriedade `https://carloshrabelo.dev/` (domínio ou *URL prefix* `…/ai/`), verificar e enviar o `sitemap.xml` (depois do item do `SITE_URL`).
- [ ] Testar uma página de evento no [Rich Results Test](https://search.google.com/test/rich-results) (Schema.org `Event`).
- [ ] Testar o preview de links (agenda e evento) no WhatsApp, Instagram/Facebook ([Sharing Debugger](https://developers.facebook.com/tools/debug/)) e LinkedIn.
- [ ] Abrir um link antigo `…/ai/?event=<id>` e conferir que ele vai para `/event/<slug>/`.

## 5. Testes em aparelhos reais

- [ ] **Barra de status do iPhone (PWA instalado)**: `apple-mobile-web-app-status-bar-style` é `black-translucent` (texto branco) e o header do tema claro agora é branco. Se o relógio e a bateria sumirem, trocar para `default` em `index.html` ou escurecer o header no tema claro.
- [ ] **Aviso de instalação** (novo): no Android/Chrome, o botão abre a instalação nativa; no iPhone, aparecem as instruções; "Agora não" esconde por 30 dias; depois de instalar, não aparece mais.
- [ ] **Comunidade → Google Agenda (Android)**: o link `calendar.google.com/calendar/render?cid=…` abre "Adicionar calendário" e o calendário aparece no app do Android. **iPhone / Mac** (`webcal://`) assina no Calendário da Apple.
- [ ] **Calendário (deslizar)**: trocar de mês deslizando para os lados, no celular e no tablet, sem atrapalhar a rolagem vertical.
- [ ] **Faixa de dias**: dia ativo centralizado; clicar num dia anterior ou posterior rola até ele; agenda ↔ mapa mantém o dia.
- [ ] **Adicionar ao calendário**: Google Agenda no Android e no desktop; `.ics` no iPhone (Safari) e no Outlook/Apple Calendar do Mac.
- [ ] **Aviso de mudanças**: adicionar um evento ao calendário e, com um evento que mude de horário/local, conferir o aviso no topo da lista.
- [ ] **Compartilhar**: menu do sistema no celular; cópia do link no desktop.
- [ ] **PWA offline**: abrir sem internet e conferir que uma versão nova aparece sozinha depois de um deploy.
- [ ] **Abrir no mapa**: rota no app de navegação do celular (Google Maps / Apple Maps).
- [ ] **Distância**: permitir a localização e conferir os valores.
- [ ] **Acessibilidade**: além do `pnpm a11y` (automático), passar a tela com leitor de tela (VoiceOver, TalkBack) e só com teclado. Conferir o estado intermediário dos conjuntos no filtro ("misto") com leitor de tela.

## 6. Conteúdo e dados

- [ ] Confirmar com o pasdedeux.pt / [@ateterca](https://www.instagram.com/ateterca/) que está tudo bem usar e exibir os eventos do calendário.
- [ ] Revisar os locais com pino errado no mapa e corrigir as coordenadas em `src/content/venues.json` (ex.: a busca automática pôs "U Dance School" no Porto; corrigido à mão em 24/11).
- [ ] Revisar tags novas que caem em **Outros** e, se fizer sentido, criar estilo ou alias em `src/domain/genres.ts`.
- [ ] **Escolas** (aba oculta): definir de onde viriam os dados antes de reativá-la.

## 7. Fotos dos perfis (promotores, DJs, professores) — branch `feature/promoter-photos`

Preencher `photo` em `src/content/promoters.json` com a foto de perfil do Instagram, automaticamente (hoje aparece só em `/test/people`; sem foto, iniciais). A branch foi refeita sobre o `main` (1 commit, só local): scripts em TypeScript como os outros, com `scripts/lib/env.ts` para ler o `.env.local`.

- `pnpm ig:token <token curto> [perfil de teste]` (`scripts/ig-token.ts`): troca o token curto por um de ~60 dias e grava `IG_ACCESS_TOKEN` e `IG_USER_ID` no `.env.local`.
- `pnpm promoters:photos [máximo] [--force]` (`scripts/promoters-photos.ts`): baixa as fotos para `public/promoters/<perfil>.jpg` e preenche `photo` (e `name`, se vazio).

Usa a **Instagram Graph API oficial (Business Discovery)**. O endpoint interno `web_profile_info` foi descartado: exige login, é contra os termos do Instagram e respondeu 429 já no primeiro perfil. Limitação: o Business Discovery só enxerga **contas profissionais** (comerciais ou de criador); contas pessoais (alguns DJs e professores) ficam com as iniciais ou com foto à mão.

**Conta do Instagram (uma vez)**

- [ ] Ter uma conta do Instagram **profissional** (comercial ou criador): Instagram → Configurações → Tipo de conta e ferramentas. Pode ser uma conta só para isso.
- [ ] Ligar essa conta a uma **Página do Facebook**: na Página → Configurações → Contas vinculadas → Instagram.

**App no Meta (uma vez)**

- [ ] Em [developers.facebook.com](https://developers.facebook.com) → Meus apps → **Criar app** → tipo **Empresa** (Business).
- [ ] Em Configurações → Básico, copiar o **ID do app** e a **Chave secreta** para o `.env.local` (`META_APP_ID=…`, `META_APP_SECRET=…`).
- [ ] Adicionar o produto **Instagram Graph API** (Instagram com login pelo Facebook) ao app.
- [ ] Em modo de desenvolvimento, o app só funciona para quem tem papel nele: a conta do Facebook que gera o token precisa ser administradora do app. Para uso só nosso, basta; a revisão do Meta só é necessária para outras pessoas usarem.

**Token (a cada ~60 dias)**

- [ ] No [Explorador da Graph API](https://developers.facebook.com/tools/explorer): escolher o app, token de **Usuário**, adicionar as permissões `instagram_basic`, `pages_show_list`, `pages_read_engagement` e `business_management`, clicar em **Generate Access Token** e autorizar a Página ligada ao Instagram.
- [ ] Copiar o token curto (vale ~1 hora) e rodar `pnpm ig:token <token curto> espacobaiao`. Deve terminar com "3. Teste com @espacobaiao: ok".
- [ ] Anotar quando vence (o script mostra a data) e repetir antes disso.

**Buscar as fotos**

- [ ] Testar com poucos perfis: `pnpm promoters:photos 3`; depois todos: `pnpm promoters:photos`. No fim ele lista quem não foi encontrado (conta pessoal ou @ errado) e quem não tem foto.
- [ ] Conferir em `/test/people`.
- [ ] Perfis que pedirem para não aparecer: `"photo": false` no `promoters.json` (o script pula).
- [ ] Commitar `public/promoters/*.jpg` e o `promoters.json`, e fazer o merge da branch.

**Depois (opcional)**

- [ ] Automatizar: secrets `IG_ACCESS_TOKEN` e `IG_USER_ID` no GitHub e `pnpm promoters:photos` na Action diária `.github/workflows/promoters.yml`, commitando também `public/promoters/`.
- [ ] Token que não vence: **usuário do sistema** (Meta Business Suite → Configurações do negócio → Usuários do sistema), em vez de renovar o de 60 dias.
- [ ] Atualizar fotos de tempos em tempos com `--force` (ex.: uma vez por mês).
- [ ] Usar no app: decidir onde a foto aparece (card do evento, bloco "Organização" nos detalhes, página de promotores), reduzir as imagens (ex.: 96×96 WebP) e manter o `"photo": false` para quem pedir para sair.

## 8. Ajustes de código

**Correções pequenas**

- [ ] **Copiar sem permissão**: `navigator.clipboard.writeText` sem `try/catch` em `src/pages/Community.tsx` (link `.ics`), `src/features/review/ReviewCard.tsx` e `src/pages/Review.tsx` lança erro quando o navegador nega (aba sem foco, permissão). O `ShareButton` já trata (cai no `window.prompt`); fazer igual.
- [ ] **Foco cortado nos atalhos de dia**: a linha Ontem/Hoje/Amanhã/Outra data rola na horizontal (`overflow-x-auto`), o que corta o contorno de foco (`outline-offset-2`) dos botões no celular.
- [ ] **Testes dos componentes novos**: `DayShortcuts`, `WeekStrip` (centralização, carregar mais ao rolar), `CalendarPicker` (deslizar), `useDayNavigation` (rolar para dia anterior com títulos `sticky`) e o cabeçalho fixo dos detalhes. Hoje só há testes de domínio; ver "Testes de ponta a ponta" abaixo.

**Lint mais rigoroso** (`.oxlintrc.json`, hoje só `rules-of-hooks` e `only-export-components`)

- [ ] Ligar `react/exhaustive-deps` e corrigir os avisos.
- [ ] Modo com tipos: `pnpm add -D oxlint-tsgolint`, rodar `oxlint --type-aware` e ligar `typescript/no-floating-promises` e `typescript/no-misused-promises` (fila do LanguageTool, `fetchNextPage`, cópias para a área de transferência). Corrigir com `await` ou `void` explícito, e trocar o `lint` no `package.json` (o CI usa esse script).

**Testes de ponta a ponta (Playwright)**

- [ ] `pnpm add -D @playwright/test @axe-core/playwright`; `playwright.config.ts` com `webServer` em modo mock (`VITE_USE_MOCK=true VITE_TEST_PAGES=false pnpm dev --port <porta>`): dados fixos, sem chave.
- [ ] Fluxos: lista carrega; faixa de dias (dia centralizado, clicar dia anterior/posterior rola até ele, dias antes do início recomeçam o feed); atalhos e "Outra data" abrindo o calendário; filtro (popover no desktop, folha no celular; desmarcar um estilo deixa o conjunto intermediário; marcar o último volta a marcar o conjunto; "Limpar"); abrir e fechar detalhes (URL `/event/<slug>/`, título e "Abrir no mapa" fixos); `/map` com data fora do carregado; barra inferior no celular; `/review` carrega.
- [ ] Acessibilidade com `@axe-core/playwright` nas telas principais, nos dois temas, e remover `scripts/a11y-check.mjs` (último script em `.mjs`) e o `axe-core` do `ignoreDependencies` do `knip.json`.
- [ ] Usar os atributos `data-track` como seletores estáveis nos testes.
- [ ] No CI (`.github/workflows/deploy.yml`): `pnpm exec playwright install --with-deps chromium` e `pnpm e2e` antes do build.

**Desempenho e dependências** (detalhes e justificativas em [`Stack.MD`](Stack.MD))

- [ ] Fontes self-hosted (`@fontsource-variable/nunito`, `@fontsource/fredoka`), só os pesos usados: tira o bloqueio de renderização pelo Google Fonts e coloca as fontes no cache do PWA (offline de verdade).
- [ ] Trocar `lucide-react` por Phosphor em `/review` e nas páginas `/test`, e remover a dependência.
- [ ] Rodar `pnpm analyze` antes de adicionar dependências ao chunk inicial (`index` ≈ 132 KB gz).
- [ ] Persister do TanStack Query em IndexedDB quando o cache de eventos passar de ~1 MB (o mapa agora busca datas avulsas).

## 9. Repositório local

- [ ] `stash@{0}` ("WIP", de um `stash pop` com conflito no `venues.json`): o conteúdo já está nos commits. Conferir com `git stash show -p stash@{0}` e apagar com `git stash drop`.
- [ ] `Ajusts.md` (fora do git): o plano já foi implementado; apagar ou mover para `docs/` se quiser manter o histórico.

## 10. Opcional

- [ ] Virtualização da lista de eventos, se a lista ficar longa demais.
- [ ] Avaliar o modo framework do React Router com `prerender` no lugar de `scripts/prerender.ts` (ver `Stack.MD`), se o prerender próprio começar a exigir manutenção.

## Feito recentemente

- Refatoração (`src/api`, `src/content`, `src/lib`, `src/domain/price`, `src/features/{price,review,range}`, scripts em TypeScript) e push do `main`; README com a estrutura atualizada.
- Zustand no lugar dos stores próprios, mantendo o formato salvo no `localStorage`; análise do bundle (`pnpm analyze`).
- Faixa de dias, atalhos, calendário com deslize, `/map` com datas próprias, detalhes com título e "Abrir no mapa" fixos, Comunidade por plataforma, cores do PWA e aviso de instalação, filtro com conjunto intermediário, `data-track` para analytics.
- Branches `feat/duolingo-theme` e `feat/tradicionais-tango` (já no `main`) apagadas; `feat/seo-ssg-share-analytics` e `feature/promoter-photos` refeitas sobre o `main`.
