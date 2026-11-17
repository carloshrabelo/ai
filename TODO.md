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

## 7. Opcional

- [ ] Domínio próprio (GitHub Pages → *Custom domain*): aí `robots.txt` e `sitemap.xml` passam a valer na raiz. Atualizar `SITE_URL` no build e o referer da chave do Google.
- [ ] Virtualização da lista de eventos, se a lista ficar longa demais.
