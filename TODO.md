# TODO

Tarefas manuais (chaves, configurações, verificações em aparelhos), projetos em andamento e ajustes de código.
Revisado em 24/11/2026: o que foi conferido no site publicado e no repositório está marcado como feito, com a
evidência entre parênteses.

- **Prioridade**: a ordem sugerida para os próximos passos.
- **A. Projetos**: trabalhos maiores, com fases (domínio, formulário, analytics, fotos).
- **B. Configuração e verificações**: contas, chaves e testes que só dá para fazer à mão.
- **C. Manutenção**: dados, código e limpeza.

## Prioridade

1. **Domínio próprio** (seção 1): no ar desde 24/11; falta o e-mail, o `.pt` (em validação) e publicar a chave nova do Google (seção 5).
2. **Barra de status do iPhone** (seção 8): com o header branco, o relógio e a bateria podem sumir no app instalado.
   Conferir num aparelho; a correção é de uma linha.
3. **Formulário "Sugerir evento"** (seção 2): só precisa do e-mail do domínio (seção 1) ou de um e-mail pessoal até lá.
4. **Analytics** (seção 3): no ar desde 24/11 (visita de teste chegou ao GoatCounter); acompanhar o painel.
5. **Performance**: preconnect, logo WebP, rótulos e eventos no HTML aplicados em 24/11 (TBT caiu pela metade). Falta o
   LCP (4,0 s), que pede renderizar a agenda no build e hidratar: [`LIGHTHOUSE.md`](LIGHTHOUSE.md).
6. **JSON-LD dos eventos** (seção 10): 9 eventos sem local, que o Google exige; `image` e `organizer` ausentes.

## A. Projetos

### 1. Domínio próprio — `lisbondance.com`

> **Principal: `lisbondance.com`** (Dynadot, comprado em 24/11/2026). **Secundário: `lisbondance.pt`**, comprado e em
> validação no DNS.PT; quando sair, redireciona para o `.com`. Comparação de registradores e preços:
> `docs/dominios.md` (arquivo local, fora do git).

O app (repositório `lisbon-social-dances`, antes `ai`) é publicado em `lisbondance.com` desde 24/11/2026. O endereço
antigo, `carloshrabelo.dev/ai/`, era de teste e não tinha usuários: ficou sem redirecionamento.

#### Feito em 24/11/2026

- [x] Registrar os dois domínios. O `.pt` ainda está em validação.
- [x] Verificar o domínio na conta do GitHub (TXT `_github-pages-challenge-carloshrabelo` na Dynadot; o GitHub pode
  levar até 24 horas para confirmar).
- [x] DNS do `.com` na Dynadot: registros **A** `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
  `185.199.111.153`; `www` como **CNAME** → `carloshrabelo.github.io`.
- [x] GitHub: `ai` renomeado para `lisbon-social-dances` (o protótipo de 2024 com esse nome saiu); **Custom domain** =
  `lisbondance.com`.
- [x] Código: `base: '/'`, `SITE_URL` padrão do build e `PUBLISHED_URL` (referer do prerender) em
  `https://lisbondance.com/`, README.

#### Falta

- [x] **Enforce HTTPS** e certificado: `http://` redireciona para `https://` (conferido em 24/11).
- [x] A chave do Google aceita `https://lisbondance.com/` (conferido em 24/11: eventos reais carregam no site).
- [ ] Chave do Google: publicar a chave nova no GitHub e conferir a restrição de domínio (seção 5).
- [ ] **AAAA** (IPv6, opcional): `2606:50c0:8000::153`, `8001::153`, `8002::153`, `8003::153` no domínio raiz.
- [x] **Renovação automática** e privacidade do WHOIS na Dynadot (24/11).
- [ ] Lembrete no calendário ~1 mês antes do vencimento de cada domínio.
- [ ] **`.pt`** (depois da validação): conferir o titular e o e-mail de contato no registrador (o `.pt` exige dados
  corretos; e-mail não verificado pode levar à suspensão) e redirecionar 301 para `https://lisbondance.com`:
  - Dynadot: *Domain → Forwarding* (URL forwarding, permanente/301).
  - OVHcloud: *Domínios → Redirecionamento* (redirecionamento visível permanente, 301), não o "invisível" (frame).
  - Testar `http://` e `https://`: o redirecionamento do registrador pode não ter certificado HTTPS; se o `https://`
    falhar, alternativa é apontar o `.pt` também para o GitHub Pages num repositório só de redirect.
- [ ] **E-mail `contato@lisbondance.com`** (usado pelo formulário, seção 2): encaminhamento grátis na **Dynadot**
  (*Email Forwarding*), com os registros **MX** e **SPF** (TXT) do painel. Não apagar os registros do GitHub Pages.

#### Conferir

- [x] `https://lisbondance.com/` abre com eventos (14 dias, 65 eventos em 24/11); `http://`, `www` e
  `carloshrabelo.dev/lisbon-social-dances/` redirecionam para `https://lisbondance.com/`.
- [x] `robots.txt` e `sitemap.xml` na raiz respondem 200.
- [ ] Google Search Console: propriedade do domínio novo e enviar o `sitemap.xml`.
- [ ] Previews de link (WhatsApp, Facebook Sharing Debugger) com o domínio novo.

### 2. Formulário "Sugerir evento"

Página para quem organiza (ou conhece) um evento sugerir que ele entre na agenda. O envio chega por e-mail para nós,
com tudo pronto para revisar e, se fizer sentido, repassar ao calendário (os eventos vêm do calendário do
pasdedeux.pt, mantido por @ateterca: a sugestão não publica nada sozinha).

#### Envio

- [ ] Serviço: **[Web3Forms](https://web3forms.com)** (grátis até 250 envios/mês; o site é estático e o JS do
  navegador não envia e-mail sozinho). O app faz `POST` para `https://api.web3forms.com/submit` com a chave pública.
- [ ] Destino: `contato@lisbondance.com` (seção 1), encaminhado para o nosso e-mail pela Dynadot
  (encaminhamento grátis). Até o domínio existir, um e-mail pessoal.
- [ ] Chave em `VITE_WEB3FORMS_KEY` (variable do repositório no deploy; `.env.example` e README). Sem a chave, o
  link "Sugerir evento" não aparece (como o GoatCounter sem o código).
- [ ] Assunto do e-mail: `Sugestão de evento: <nome> — <dia>`; `replyTo` = e-mail de quem sugeriu (responder sai
  direto para a pessoa).

#### Campos (no formato que o calendário usa: título `Tag • Nome • Preço`, local, descrição)

- [ ] **Nome do evento** (obrigatório).
- [ ] **Estilos** (obrigatório, um ou mais): os chips do filtro (`GENRES`, mesmos conjuntos Latinas/Afro/BR) + "Outro"
  com texto livre. Viram a tag (ex.: Salsa + Bachata → `Salsa & Bachata`).
- [ ] **Data** e **hora de início/fim** (obrigatórios; fim pode passar da meia-noite), fuso de Lisboa. Opção
  **"Repete toda semana"** (dia da semana + até quando), comum em práticas.
- [ ] **Local**: nome e endereço (ou link do Google Maps). Sugerir os locais conhecidos de `src/content/venues.json`
  ao digitar (o mapa já tem as coordenadas).
- [ ] **Preço**: valor(es) ou "Grátis" / "Não sei"; texto livre curto como no calendário ("10€ | 8€ alunos").
- [ ] **Descrição** (texto livre) e **links**: Instagram/Facebook/site do evento ou do organizador.
- [ ] **Quem sugere**: nome, e-mail (obrigatório, para respondermos) e "Sou o organizador" (sim/não).
- [ ] **Consentimento** (RGPD): caixa obrigatória "Concordo que estes dados sejam usados para avaliar e publicar o
  evento", com link para um aviso de privacidade curto (o que é guardado, por quanto tempo, como pedir para apagar).

#### Conteúdo do e-mail

- [ ] Título já no formato do calendário: `Salsa & Bachata • Nome do evento • 10€`.
- [ ] Bloco com todos os campos e um **link "Adicionar ao Google Agenda"** já preenchido (`action=TEMPLATE`, mesmo
  formato de `googleCalendarUrl` em `src/features/events/calendarLinks.ts`): um clique abre o evento pronto para
  salvar no calendário escolhido.
- [ ] Prévia de como o evento vai aparecer: rodar os campos por `toDanceEvent` (mesmo parser do app) e listar os
  estilos e o preço reconhecidos. Se o parser não reconhecer algo (estilo cai em "Outros", preço sem formato), avisar
  no e-mail.

#### Na interface

- [ ] Rota `/suggest` (indexável e no `sitemap.xml`: atrai organizadores pela busca), link em **Comunidade** e em **Sobre**, e no estado vazio da
  agenda ("Não achou o seu evento? Sugira"). Item no menu só se fizer sentido depois.
- [ ] **Prévia ao vivo** com o próprio `EventCard` enquanto a pessoa preenche (mesmo visual da lista).
- [ ] Validação no próprio form (campos obrigatórios, fim depois do início, e-mail válido), mensagens em pt-BR e
  en-US (`src/i18n/messages`).
- [ ] **Rascunho salvo no aparelho** (store Zustand com `persist`, como os outros): se a pessoa sair ou ficar sem
  internet, não perde o que digitou. Limpar depois do envio.
- [ ] Sem internet (PWA offline): botão desabilitado com o aviso, rascunho guardado.
- [ ] Estados: enviando, sucesso ("Recebemos! Vamos avaliar e responder por e-mail"), erro com "Tentar de novo".
- [ ] **Antispam**: campo escondido (*honeypot*, o Web3Forms ignora o envio se vier preenchido); se aparecer spam,
  hCaptcha (suportado pelo Web3Forms) ou Cloudflare Turnstile.
- [ ] Analytics: `data-track` `suggest.open`, `suggest.submit`, `suggest.success`, `suggest.error` no catálogo de
  `src/analytics/track.ts` (chegam no GoatCounter, seção 3).
- [ ] Acessibilidade: rótulos em todos os campos, erros ligados ao campo (`aria-describedby`), foco no primeiro erro;
  conferir com `pnpm a11y`.

#### Testes

- [ ] Unidade: montar o título `Tag • Nome • Preço` a partir dos campos e passar pelo `parseSummary`/`toDanceEvent`
  (o que sai do form precisa ser lido igual pelo app); link do Google Agenda com datas e fuso certos (inclusive
  evento que passa da meia-noite e horário de verão).
- [ ] Playwright (seção 10): preencher, ver a prévia, enviar com o Web3Forms mockado, erro e repetir, rascunho mantido
  ao recarregar.

#### Depois (opcional)

- [ ] Se o volume crescer: em vez de e-mail, gravar numa planilha (Web3Forms → webhook pago, ou Google Forms) e ter
  uma página interna de revisão, como a `/review`.
- [ ] Combinar com @ateterca o fluxo de repasse (encaminhar o e-mail, ou ela receber cópia direto).

### 3. Analytics (GoatCounter)

No `main` desde 24/11 (branch `feat/seo-ssg-share-analytics`): o GoatCounter conta as páginas vistas e recebe todos os cliques com `data-track` por um listener só (`connectTrackedClicks`), sem chamadas nos componentes. Desligado sem `VITE_GOATCOUNTER_CODE` e sempre em `pnpm dev`.

- [x] Publicar a branch refeita e fazer o merge no `main` (24/11).
- [x] Criar a conta e o site em [goatcounter.com](https://www.goatcounter.com): código `cid360` (`https://cid360.goatcounter.com`).
- [x] Em **Settings → Secrets and variables → Actions**, criar a variable `VITE_GOATCOUNTER_CODE` com esse código.
- [x] Conferido em 24/11: o script carrega e a visita chega ao GoatCounter (`cid360`).
- [ ] Acompanhar no painel: páginas vistas e eventos como `filters.genre/Salsa`, `event.open/<slug>`, `dates.strip-day/<dia>` (a lista de nomes está em `src/analytics/track.ts`).
- [x] `event.open`: os dois, o total (`event.open`) e qual evento (`event.open/<slug>`). Quem abre o evento direto pelo link (`/event/<slug>/`) conta como página vista, não como clique.
- [x] **Recorrência** (`src/analytics/visits.ts`): uma vez por dia por aparelho, `visit.new` ou `visit.return`, com `visit.count/<dias com visita>` (1, 2, 3-5, 6-10, 11+) e `visit.gap/<intervalo>` (1d, 2-7d, 8-30d, 30d+). Sem identificador: o aparelho guarda só a primeira e a última data e o total de dias. Nos primeiros dias, quem já usava o site conta como `visit.new` (não havia registro).
- [x] Página Sobre: seção "Privacidade" com o que o analytics registra (páginas, cliques e recorrência, sem identificar ninguém).

### 4. Fotos dos perfis (promotores, DJs, professores) — branch `feature/promoter-photos`

Preencher `photo` em `src/content/promoters.json` com a foto de perfil do Instagram, automaticamente (hoje aparece só em `/test/people`; sem foto, iniciais). A branch foi refeita sobre o `main` (1 commit, só local): scripts em TypeScript como os outros, com `scripts/lib/env.ts` para ler o `.env.local`.

- `pnpm ig:token <token curto> [perfil de teste]` (`scripts/ig-token.ts`): troca o token curto por um de ~60 dias e grava `IG_ACCESS_TOKEN` e `IG_USER_ID` no `.env.local`.
- `pnpm promoters:photos [máximo] [--force]` (`scripts/promoters-photos.ts`): baixa as fotos para `public/promoters/<perfil>.jpg` e preenche `photo` (e `name`, se vazio).

Usa a **Instagram Graph API oficial (Business Discovery)**. O endpoint interno `web_profile_info` foi descartado: exige login, é contra os termos do Instagram e respondeu 429 já no primeiro perfil. Limitação: o Business Discovery só enxerga **contas profissionais** (comerciais ou de criador); contas pessoais (alguns DJs e professores) ficam com as iniciais ou com foto à mão.

#### Conta do Instagram (uma vez)

- [ ] Ter uma conta do Instagram **profissional** (comercial ou criador): Instagram → Configurações → Tipo de conta e ferramentas. Pode ser uma conta só para isso.
- [ ] Ligar essa conta a uma **Página do Facebook**: na Página → Configurações → Contas vinculadas → Instagram.

#### App no Meta (uma vez)

- [ ] Em [developers.facebook.com](https://developers.facebook.com) → Meus apps → **Criar app** → tipo **Empresa** (Business).
- [ ] Em Configurações → Básico, copiar o **ID do app** e a **Chave secreta** para o `.env.local` (`META_APP_ID=…`, `META_APP_SECRET=…`).
- [ ] Adicionar o produto **Instagram Graph API** (Instagram com login pelo Facebook) ao app.
- [ ] Em modo de desenvolvimento, o app só funciona para quem tem papel nele: a conta do Facebook que gera o token precisa ser administradora do app. Para uso só nosso, basta; a revisão do Meta só é necessária para outras pessoas usarem.

#### Token (a cada ~60 dias)

- [ ] No [Explorador da Graph API](https://developers.facebook.com/tools/explorer): escolher o app, token de **Usuário**, adicionar as permissões `instagram_basic`, `pages_show_list`, `pages_read_engagement` e `business_management`, clicar em **Generate Access Token** e autorizar a Página ligada ao Instagram.
- [ ] Copiar o token curto (vale ~1 hora) e rodar `pnpm ig:token <token curto> espacobaiao`. Deve terminar com "3. Teste com @espacobaiao: ok".
- [ ] Anotar quando vence (o script mostra a data) e repetir antes disso.

#### Buscar as fotos

- [ ] Testar com poucos perfis: `pnpm promoters:photos 3`; depois todos: `pnpm promoters:photos`. No fim ele lista quem não foi encontrado (conta pessoal ou @ errado) e quem não tem foto.
- [ ] Conferir em `/test/people`.
- [ ] Perfis que pedirem para não aparecer: `"photo": false` no `promoters.json` (o script pula).
- [ ] Commitar `public/promoters/*.jpg` e o `promoters.json`, e fazer o merge da branch.

#### Depois (opcional)

- [ ] Automatizar: secrets `IG_ACCESS_TOKEN` e `IG_USER_ID` no GitHub e `pnpm promoters:photos` na Action diária `.github/workflows/daily.yml`, commitando também `public/promoters/`.
- [ ] Token que não vence: **usuário do sistema** (Meta Business Suite → Configurações do negócio → Usuários do sistema), em vez de renovar o de 60 dias.
- [ ] Atualizar fotos de tempos em tempos com `--force` (ex.: uma vez por mês).
- [ ] Usar no app: decidir onde a foto aparece (card do evento, bloco "Organização" nos detalhes, página de promotores), reduzir as imagens (ex.: 96×96 WebP) e manter o `"photo": false` para quem pedir para sair.

## B. Configuração e verificações

### 5. Chave da Google Calendar API

- [x] Projeto, Google Calendar API ativada e API key criada (o site publicado mostra os eventos reais: só 8 dos 71 títulos do sitemap existem no mock).
- [x] **Duas chaves** num projeto nosso (24/11):
  - **Produção** (secret `VITE_GOOGLE_API_KEY` no GitHub, termina em `…wOV4`): só `https://lisbondance.com/*` (e
    `www`). Conferido em 24/11: aceita o domínio, recusa sem referer, `example.org`, `localhost` e
    `carloshrabelo.dev` (403). O build e a Action diária mandam o referer do site.
  - **Desenvolvimento** (`.env.local`, termina em `…qUiA`): para `pnpm dev` e os scripts locais. Restringir a
    `http://localhost:*/*` (em 24/11 ainda aceitava qualquer referer); os scripts locais mandam o referer do site,
    então incluir também `https://lisbondance.com/*` se forem rodados com ela.
- [ ] A antiga (`…AXxs`, criada em 17/11 numa conta não identificada, sem restrição) saiu do site; apagar se a conta
  for encontrada (utilizável por quem a copiou; sem custo, só cota).
- [ ] Nunca commitar o `.env.local` (já está no `.gitignore`). Se a chave vazar, gerar outra e apagar a antiga.

### 6. GitHub (Settings do repositório)

- [x] **Pages** com GitHub Actions (deploy de hoje publicado: manifest com as cores novas).
- [x] Secret `VITE_GOOGLE_API_KEY` e variable `VITE_USE_MOCK` = `false` (eventos reais no ar).
- [x] Action **Update data** (`daily.yml`, 05:00 UTC): cache dos eventos → venues → promoters → um commit → deploy. Substitui as Actions Update venues e Update promoters e o cron do deploy.
- [ ] Conferir a primeira execução da **Update data** em **Actions** (ou rodar à mão: *Run workflow*) e se `https://lisbondance.com/events-cache.json` foi publicado.
- [x] *Custom domain* `lisbondance.com` e **Enforce HTTPS** (seção 1).

### 7. SEO e compartilhamento

Os itens que dependem do domínio (`SITE_URL`, `robots.txt`, Google Search Console) estão na seção 1.

- [ ] Testar uma página de evento no [Rich Results Test](https://search.google.com/test/rich-results) (Schema.org `Event`).
- [ ] Testar o preview de links (agenda e evento) no WhatsApp, Instagram/Facebook ([Sharing Debugger](https://developers.facebook.com/tools/debug/)) e LinkedIn.
- [x] Link antigo `…/?event=<id>` vai para `/event/<slug>/` (mantendo a query); id inexistente só limpa o parâmetro (teste em `e2e/seo.spec.ts`).

### 8. Testes em aparelhos reais

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

## C. Manutenção

### 9. Conteúdo e dados

- [ ] Confirmar com o pasdedeux.pt / [@ateterca](https://www.instagram.com/ateterca/) que está tudo bem usar e exibir os eventos do calendário.
- [ ] Revisar os locais com pino errado no mapa e corrigir as coordenadas em `src/content/venues.json` (ex.: a busca automática pôs "U Dance School" no Porto; corrigido à mão em 24/11).
- [ ] Revisar tags novas que caem em **Outros** e, se fizer sentido, criar estilo ou alias em `src/domain/genres.ts`.
  Em 24/11, dos 220 eventos publicados só 1 caiu em Outros: tag **`Balboa`** ("Beer & Balboa"). Proposta: alias
  `BALBOA → Swing` (é uma dança da família do swing).
- [ ] **Escolas** (aba oculta): definir de onde viriam os dados antes de reativá-la.

### 10. Código

#### Feito (24/11)

- [x] **Copiar sem permissão**: `copyText` (`src/lib/clipboard.ts`) em todas as cópias; sem permissão, mostra o texto
  num `prompt` em vez de lançar erro.
- [x] **Foco cortado nos atalhos de dia**: 4px de folga dentro da área que rola (`-m-1 p-1`).
- [x] **Testes de componente** (React Testing Library em jsdom, apoio em `src/test/`): `CalendarPicker`, `DayShortcuts`,
  `WeekStrip`, `useDayNavigation` e o cabeçalho fixo dos detalhes.
- [x] **Lint**: `react/exhaustive-effect-dependencies` (os 6 efeitos com gatilho de propósito estão anotados) e, com
  tipos (`oxlint --type-aware`, `oxlint-tsgolint`), `no-floating-promises` e `no-misused-promises`, também no
  lint-staged. O `react/exhaustive-deps` está ligado, mas não dispara nesta versão do oxlint (testado).
- [x] **Playwright** (`pnpm e2e`, em `e2e/`; no CI antes do build): agenda, faixa de dias, "Outra data", filtro com
  conjunto intermediário, detalhes, barra inferior, `/map` com data nova, `/review`, link antigo `?event=` e JSON-LD;
  acessibilidade com axe nos dois temas (`pnpm a11y`). `scripts/a11y-check.mjs` e o `axe-core` direto removidos.
- [x] **Fontes self-hosted** (`src/fonts.css`, Nunito e Fredoka variáveis, só latin e latin-ext, ~109 KB no cache do
  PWA); sem Google Fonts.
- [x] **`lucide-react` removido**: Phosphor em `/review` e nas páginas `/test`.
- [x] Contraste da atribuição do mapa no tema escuro (o fundo branco do Leaflet vencia o do tema), achado pelo axe.

#### Pendente

- [ ] **JSON-LD dos eventos** (validado nas 267 páginas do build): **9 eventos sem `location`**, que o Google exige
  (ex.: "Milonga Tango na Rua", sem local no calendário). Opções: não gerar o JSON-LD `Event` desses eventos, ou
  usar a cidade como `Place`. Recomendados ausentes em todos: `image` (dá para usar o `og-image.jpg`) e `organizer`
  (do diretório de promotores, `src/content/promoters.json`).
- [ ] Formulário "Sugerir evento" no Playwright quando existir (seção 2).
- [ ] Rodar `pnpm analyze` antes de adicionar dependências ao chunk inicial (`index` ≈ 132 KB gz).
- [ ] Persister do TanStack Query em IndexedDB quando o cache de eventos passar de ~1 MB (o mapa agora busca datas avulsas).

### 11. Repositório local

- [ ] `stash@{0}` ("WIP", de um `stash pop` com conflito no `venues.json`): o conteúdo já está nos commits. Conferir com `git stash show -p stash@{0}` e apagar com `git stash drop`.
- [x] `Ajusts.md` (fora do git): já não existe (conferido em 24/11).

### 12. Opcional

- [ ] Virtualização da lista de eventos, se a lista ficar longa demais.
- [ ] Avaliar o modo framework do React Router com `prerender` no lugar de `scripts/prerender.ts` (ver `Stack.MD`), se o prerender próprio começar a exigir manutenção.

## Feito recentemente

- Refatoração (`src/api`, `src/content`, `src/lib`, `src/domain/price`, `src/features/{price,review,range}`, scripts em TypeScript) e push do `main`; README com a estrutura atualizada.
- Zustand no lugar dos stores próprios, mantendo o formato salvo no `localStorage`; análise do bundle (`pnpm analyze`).
- Faixa de dias, atalhos, calendário com deslize, `/map` com datas próprias, detalhes com título e "Abrir no mapa" fixos, Comunidade por plataforma, cores do PWA e aviso de instalação, filtro com conjunto intermediário, `data-track` para analytics.
- Branches `feat/duolingo-theme` e `feat/tradicionais-tango` (já no `main`) apagadas; `feat/seo-ssg-share-analytics` e `feature/promoter-photos` refeitas sobre o `main`.
