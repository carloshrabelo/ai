# TODO — tarefas manuais

Coisas que o código não resolve sozinho: chaves, configurações e verificações que precisam ser feitas à mão.

## 1. Chave da Google Calendar API

- [ ] Criar um projeto no [Google Cloud Console](https://console.cloud.google.com/) (ou usar um existente).
- [ ] Ativar a **Google Calendar API** em *APIs & Services → Library*.
- [ ] Criar uma **API key** em *APIs & Services → Credentials*.
- [ ] Restringir a chave (ela fica visível no JavaScript publicado):
  - *Application restrictions* → **HTTP referrers**: `https://carloshrabelo.github.io/ai/*` e, para desenvolvimento, `http://localhost:*/*`.
    O build das páginas estáticas (`scripts/prerender.mjs`) envia o referer do site, então a restrição também vale para o deploy.
  - *API restrictions* → só **Google Calendar API**.
- [ ] Colocar a chave no `.env.local` (`VITE_GOOGLE_API_KEY=…`, com `VITE_USE_MOCK=false`) e testar com `pnpm dev`.
- [ ] Nunca commitar o `.env.local` (já está no `.gitignore`). Se a chave vazar, gerar outra e apagar a antiga.

## 2. GitHub (Settings do repositório)

- [ ] **Pages** → *Source*: **GitHub Actions**.
- [ ] **Secrets and variables → Actions**:
  - [ ] Secret `VITE_GOOGLE_API_KEY` com a chave do passo 1.
  - [ ] Variable `VITE_USE_MOCK` = `false` (sem ela, o site é publicado com o mock).
- [ ] **Actions → General → Workflow permissions**: se a Action *Update venues* falhar no push, permitir *Read and write* (ela grava o `venues.json` no `main`). Uma proteção de branch no `main` também bloquearia esse push.
- [ ] Rodar uma vez à mão: **Actions → Update venues → Run workflow**, e conferir o commit do bot e o deploy seguinte.
- [ ] Conferir se o deploy diário (05:30 UTC) está rodando em **Actions → Deploy to GitHub Pages**.

## 3. Analytics (GoatCounter) — branch `feat/seo-ssg-share-analytics`

O analytics está pronto, mas fica fora do `main` até ser configurado. A branch contém só ele.

- [ ] Criar a conta e o site em [goatcounter.com](https://www.goatcounter.com) (o código é o `<codigo>` de `https://<codigo>.goatcounter.com`).
- [ ] Em **Settings → Secrets and variables → Actions**, criar a variable `VITE_GOATCOUNTER_CODE` com esse código.
- [ ] Fazer o merge da branch: https://github.com/carloshrabelo/ai/compare/main...feat/seo-ssg-share-analytics
- [ ] Depois do deploy, abrir o site e conferir se as visitas e os eventos (filtros, eventos abertos, calendário, compartilhar, mapa) aparecem no painel.

## 4. SEO e compartilhamento (depois do deploy com a API)

- [ ] [Google Search Console](https://search.google.com/search-console): adicionar a propriedade *URL prefix* `https://carloshrabelo.github.io/ai/`, verificar (meta tag no `index.html` ou arquivo HTML em `public/`) e enviar `sitemap.xml`.
- [ ] `robots.txt`: no GitHub Pages, o que vale é o da raiz do domínio (`carloshrabelo.github.io/robots.txt`). Se existir o repositório `carloshrabelo.github.io`, colocar lá a linha `Sitemap: https://carloshrabelo.github.io/ai/sitemap.xml`.
- [ ] Testar uma página de evento no [Rich Results Test](https://search.google.com/test/rich-results) (Schema.org `Event`).
- [ ] Testar o preview de links (agenda e evento) no WhatsApp, Instagram/Facebook ([Sharing Debugger](https://developers.facebook.com/tools/debug/)) e LinkedIn.
- [ ] Abrir um link antigo `…/ai/?event=<id>` e conferir que ele vai para `/evento/<slug>/`.

## 5. Testes em aparelhos reais

- [ ] **Adicionar ao calendário**: Google Agenda no Android e no desktop; `.ics` no iPhone (Safari) e no Outlook/Apple Calendar do Mac.
- [ ] **Aviso de mudanças**: adicionar um evento ao calendário e, com um evento que mude de horário/local, conferir o aviso no topo da lista.
- [ ] **Compartilhar**: menu do sistema no celular; cópia do link no desktop.
- [ ] **PWA**: instalar no Android e no iPhone ("Adicionar à Tela de Início"), abrir offline e conferir que uma versão nova aparece sozinha depois de um deploy.
- [ ] **Abrir no mapa**: rota no app de navegação do celular (Google Maps / Apple Maps).
- [ ] **Distância**: permitir a localização e conferir os valores.
- [ ] **Acessibilidade**: além do `pnpm a11y` (automático), passar a tela com leitor de tela (VoiceOver no iPhone/Mac, TalkBack no Android) e só com teclado.

## 6. Conteúdo e dados

- [ ] Confirmar com o pasdedeux.pt / [@ateterca](https://www.instagram.com/ateterca/) que está tudo bem usar e exibir os eventos do calendário.
- [ ] Revisar os locais com pino errado no mapa e corrigir as coordenadas em `src/data/venues.json`.
- [ ] Revisar tags novas que caem em **Outros** e, se fizer sentido, criar estilo ou alias em `src/domain/genres.ts`.
- [ ] **Escolas** (aba oculta): definir de onde viriam os dados antes de reativá-la.

## 7. Fotos dos perfis (promotores, DJs, professores) — branch `feature/promoter-photos`

Preencher `photo` em `src/data/promoters.json` com a foto de perfil do Instagram, automaticamente (hoje aparece só em `/teste/envolvidos`; sem foto, iniciais). O código está na branch, fora do `main` até ser configurado:

- `pnpm ig:token <token curto> [perfil de teste]` (`scripts/ig-token.mjs`): troca o token curto por um de ~60 dias e grava `IG_ACCESS_TOKEN` e `IG_USER_ID` no `.env.local`.
- `pnpm promoters:photos [máximo] [--force]` (`scripts/promoters-photos.mjs`): baixa as fotos para `public/promoters/<perfil>.jpg` e preenche `photo` (e `name`, se vazio).

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
- [ ] Conferir em `/teste/envolvidos`.
- [ ] Perfis que pedirem para não aparecer: `"photo": false` no `promoters.json` (o script pula).
- [ ] Commitar `public/promoters/*.jpg` e o `promoters.json`, e fazer o merge da branch.

**Depois (opcional)**

- [ ] Automatizar: secrets `IG_ACCESS_TOKEN` e `IG_USER_ID` no GitHub e `pnpm promoters:photos` na Action diária `.github/workflows/promoters.yml`, commitando também `public/promoters/`.
- [ ] Token que não vence: **usuário do sistema** (Meta Business Suite → Configurações do negócio → Usuários do sistema), em vez de renovar o de 60 dias.
- [ ] Atualizar fotos de tempos em tempos com `--force` (ex.: uma vez por mês).
- [ ] Usar no app: decidir onde a foto aparece (card do evento, bloco "Organização" nos detalhes, página de promotores), reduzir as imagens (ex.: 96×96 WebP) e manter o `"photo": false` para quem pedir para sair.

## 8. Opcional

- [ ] Domínio próprio (GitHub Pages → *Custom domain*): aí `robots.txt` e `sitemap.xml` passam a valer na raiz. Atualizar `SITE_URL` no build e o referer da chave do Google.
- [ ] Virtualização da lista de eventos, se a lista ficar longa demais.
