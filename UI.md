# UI — análise e sugestões de melhoria

> **Status (19/11/2026):** aplicadas na `main`, exceto:
> - **1.1:** o `/review` e as páginas de teste ainda usam Lucide. Por isso, `lucide-react` continua no `package.json`.
> - **2.1:** abaixo de `sm`, o nome da página saiu do header (fica só para leitor de tela). O nome do app continua inteiro.
> - **3.5:** o modo compacto não foi feito. Depende de decidir como ligar/desligar.
> - **6.3:** os perfis citados não viraram chips com avatar. A descrição foi recolhida e as linhas repetidas saíram.
> - **11.2:** o número do dia na faixa ficou em Nunito bold, não em Fredoka.

Análise de todo o front (exceto `/test`), feita em 19/11/2026 sobre a `main`. Base:

- prints em 390px (celular), 768px (tablet), 1280px, 1440px e 1920px, nos temas claro e escuro, em pt-BR e em inglês;
- leitura dos componentes.

O ponto de partida é o tema Duolingo adotado. Os padrões dele:

| Elemento | Padrão |
|---|---|
| Moldura | `rounded-2xl border-2 border-b-4`, sem sombra |
| Botão | 3D, com base que afunda ao apertar |
| Fontes | Fredoka nos títulos, Nunito no texto |
| Ícones | Phosphor Duotone |
| Cor principal | Roxo da logo |

Cada item diz **onde** está o problema, **o que** muda e **por quê**. As prioridades:

| Prioridade | Quando usar |
|---|---|
| 🔴 Alta | Quebra o padrão de forma visível, ou atrapalha o uso |
| 🟡 Média | Melhora clara, mas o app funciona sem |
| 🟢 Ideia | Funcionalidade ou refinamento para avaliar |

---

## 1. Consistência com o tema

### 🔴 1.1 Ícones do Lucide que sobraram
Ainda há 11 arquivos do app com `lucide-react`. Ao lado dos Phosphor Duotone, eles destoam: traço fino e sem preenchimento.

| Onde | Ícones |
|---|---|
| `features/events/SelectedEventView.tsx` | `ArrowLeft` (voltar do drawer), `X` (fechar painel), `CalendarX` |
| `features/genres/GenreFilterPopover.tsx` | `X` (fechar) |
| `features/events/EventFeed.tsx` | `CalendarX`, `SearchX` (estados vazios) |
| `features/events/EventStatusBadge.tsx` | `CalendarClock`, `CircleX` (adiado/cancelado) |
| `features/events/ShareButton.tsx` | `Check` |
| `features/price/PriceChips.tsx` | Ícones dos rótulos de preço (`Gift`, `GraduationCap`, `Moon`, `DoorOpen`…) |
| `features/location/LocationControl.tsx` | `RefreshCw` |
| `pages/Community.tsx` | `CalendarDays`, `MessageCircle`, `AtSign`, `CalendarPlus`, `Copy`, `ExternalLink`, `Check` |
| `pages/Schools.tsx` | `School` |

Trocar todos pelos equivalentes do Phosphor. Para escolher, dá para usar `/test/icons`, acrescentando os grupos que faltam. Depois, tirar `lucide-react` do `package.json`.

O `/review` e as páginas de teste também usam Lucide. Ficam por último ou continuam como estão, porque são ferramentas internas.

### 🔴 1.2 Controles com o visual antigo
O tema ainda não alcançou alguns componentes. Eles têm `rounded-lg`/`rounded-md`, `shadow-*` e `font-medium`:

- **`Segmented`** (`components/ui/Segmented.tsx`), usado em Tema e Idioma na página Sobre:
  - hoje é uma pílula cinza com a opção ativa branca e sombra;
  - sugestão: moldura de 2px; a opção ativa no estilo `TOOL_ACTIVE` (roxo com base mais escura) ou com borda roxa; texto em `font-bold`.
- **Botão da página de erro** (`pages/ErrorPage.tsx`): é um `<button>` feito à mão, com `rounded-lg`. Trocar por `<Button>`.
- **Link "Voltar ao início" do 404** (`pages/NotFound.tsx`): é só texto. Usar `buttonClassName('primary')`.
- **Banner de mudanças** (`features/tracking/ChangesBanner.tsx`): `rounded-xl` com borda de 1px amarela. Usar a moldura (`rounded-2xl border-2 border-b-4`), mantendo o amarelo.
- **Aviso de nova versão** (`components/ReloadPrompt.tsx`): `bg-slate-900` fixo. Ele não segue os tokens (`--surface`, `--fg`) e fica igual nos dois temas.
- **Tooltip** (`components/ui/Tooltip.tsx`): `rounded-md` e `slate-900`. Pode ficar escuro, mas com `rounded-xl` e tokens.
- **Botão de instalar** (`components/InstallButton.tsx`) e **resumo sobre o mapa** (`features/map/MapPanel.tsx`, `rounded-xl shadow-sm`): conferir e alinhar com a moldura.

### 🔴 1.3 Sombras que o tema não usa
O tema troca sombra por borda com base. Ainda há:

- `hover:shadow-md` no card (`EventCard.tsx`);
- `shadow-md`/`shadow-lg` nos cards do carrossel do /map (`MapPage.tsx`);
- `shadow-lg` no `Card variant="panel"`, no popover de filtros e no painel "Mostrar distâncias" da sidebar;
- `shadow-sm` no item ativo da sidebar.

**Sugestão:**
- hover do card: borda um tom mais escura, ou `-translate-y-0.5`;
- painéis flutuantes (popover, sheet): podem manter **uma** sombra suave, porque flutuam sobre o conteúdo. Ainda assim, com a moldura de 2px.

### 🟡 1.4 Chips de preço
Hoje são `rounded-full`, borda de 1px e `text-xs`, ao lado dos chips de gênero, que são 3D, `rounded-xl` e `font-bold`. Parecem de outro app.

- **Sugestão:** chip neutro com `rounded-xl`, borda de 2px e `font-bold`, sem a base 3D. Assim fica claro que não é clicável.
- **"Ver descrição | Consultar organizador":** a borda tracejada em `text-xs` e `fg-muted` some no tema claro. Avaliar contraste e tamanho mínimo de 13px.

### 🟡 1.5 Navegação da sidebar (desktop)
O item ativo é um cartão branco com `shadow-sm`, e os outros são texto cinza.

- **Sugestão no estilo Duolingo:** item ativo com fundo roxo bem claro (`bg-brand/10`), borda de 2px roxa e texto roxo em negrito. Os inativos ficam com hover em `surface`.
- O ícone ativo também pode ficar roxo. Hoje ele já fica, mas é sutil.

---

## 2. Header e navegação

### 🔴 2.1 Título cortado no celular
Em 390px, "Lisbon Social Dance · Agenda" não cabe, e o nome da página fica com reticências ("Comuni…", "Explora…"). No celular, a barra inferior já mostra a página ativa. Opções:

- abaixo de `sm`, mostrar só o nome do app;
- ou abreviar o nome do app para **"Lisbon Dance"** (o `short_name` do manifest) abaixo de `sm`.

### 🟡 2.2 Devtools sobre o header (só em dev)
O círculo com a palmeira no canto do header é o botão do **TanStack Query Devtools** (`main.tsx`, `buttonPosition="top-right"`). Ele cobre o título nos prints e confunde a análise visual.

- **Sugestão:** `buttonPosition="bottom-left"`, ou só com `?devtools`.

### 🟡 2.3 Barra inferior
Hoje o ativo só muda a cor do ícone e do texto.

- **Sugestão (estilo Duolingo):** um "indicador" atrás do ícone ativo, como uma pílula de `bg-brand/10` com borda roxa.
- Avaliar ícones `weight="fill"` no ativo e `duotone` nos inativos.

### 🟢 2.4 Inglês com data americana
Em inglês, a data aparece "Thursday, 11/19" (formato dos EUA).

- **Sugestão:** usar `en-GB` ("Thursday, 19/11"), mais natural em Lisboa e igual à ordem em português.

---

## 3. Agenda (lista)

### 🔴 3.1 Cards de alturas e layouts diferentes na grade de 2 colunas (1280–1535px)
Com ~260px úteis, cada card quebra de um jeito:

- o preço desce para baixo do horário em uns e não em outros;
- as tags vão para 2 linhas;
- o ícone de "abrir" fica no meio da linha de tags;
- o local é cortado ("Dança Mais com Camila Delp…").

Com o grid esticando a altura, sobram áreas vazias.

Opções:

- **(a)** Entre `xl` e `2xl`, 1 coluna de cards. O mapa já ocupa a direita, e 2 colunas estreitas rendem pouco.
- **(b)** Container queries no card (`@container`). Abaixo de ~300px, preço sempre em linha própria e tags sem o ícone ao lado.

### 🟡 3.2 Ícone "abrir detalhes" (↗)
O card inteiro já abre os detalhes, então o ícone ocupa espaço nas tags sem ser um alvo. Opções:

- removê-lo;
- ou levá-lo para o canto do cabeçalho, no lugar de um segundo ícone.

Com isso, as tags ganham a largura toda.

### 🟡 3.3 Títulos dos dias
"Quinta-feira, 19/11" está em `text-sm` cinza: discreto demais para separar grupos numa lista longa.

- deixar o título do dia **sticky** abaixo da faixa de dias, para saber em que dia se está ao rolar;
- usar "Hoje", "Amanhã" e "Sábado, 21/11" (relativo para os próximos dias);
- tamanho `text-base` e `font-bold` em `fg`.

### 🟢 3.4 Estado do evento no tempo
- **"Agora":** evento em andamento hoje, com um ponto pulsando ou chip verde.
- **"Encerrado":** evento que já acabou hoje, com opacidade 60% ou movido para o fim do dia.

### 🟢 3.5 Densidade no celular
Cabem ~3 cards por tela. Avaliar um modo compacto: 1 linha de local + horário + preço, com tags menores.

---

## 4. Faixa de dias, atalhos e calendário

### 🟡 4.1 Faixa de dias sem sinal de rolagem
No celular, o 5º dia é cortado na borda sem nenhum indicador.

- **Sugestão:** um degradê (máscara) nas bordas quando há mais dias para os lados.

### 🟡 4.2 Faixa curta em telas largas
Em 1920px, a faixa mostra 14 dias e sobra espaço vazio à direita. Opções:

- distribuir os dias na largura (`justify-between`);
- ou mostrar mais dias.

### 🟢 4.3 Dias sem evento
Hoje nada indica se um dia tem eventos.

- **Sugestão:** um ponto embaixo do número nos dias com eventos, como em apps de agenda. Considera o filtro de gêneros ativo.

### 🟢 4.4 Seletor de data nativo
O botão de calendário abre o seletor do navegador, que é diferente em cada sistema e não segue o tema.

- **Sugestão:** um calendário próprio (popover no desktop, bottom sheet no celular) com a grade do mês e os mesmos pontos de "tem evento" do 4.3.

### 🟡 4.5 Atalhos na sidebar
"Ontem / Hoje / Amanhã" quebram em 2 linhas na sidebar de 288px (em inglês, "Tomorrow" vai sozinho para baixo).

- **Sugestão:** um grupo segmentado com as três opções numa linha, de largura igual (`grid-cols-3`).

---

## 5. Filtros

### 🟡 5.1 "Mostrar distâncias" dentro do sheet de filtros
A localização não é um filtro de gênero, e o botão fica entre os estilos e "Ver eventos".

- **Sugestão:** levar o botão para o topo da lista (como um chip "📍 Perto de mim") ou para a página Sobre/ajustes.
- No desktop, ele fica sozinho num painel no rodapé da sidebar. Lá, o rótulo quebra em 2 linhas ("MOSTRAR / DISTÂNCIAS"). Encurtar para "Distâncias" ou "Perto de mim".

### 🟡 5.2 Conjuntos e estilos se parecem
Os chips de conjunto (🇩🇴 Latinas, 🇦🇴 Afro, 🇧🇷 BR) e os de estilo têm o mesmo visual, mudando só o canto.

- **Sugestão:** conjunto como título clicável da seção (com check), e os estilos como chips.

### 🟢 5.3 Contagem no botão do sheet
"Ver eventos" → **"Ver 12 eventos"**. A pessoa sabe o efeito do filtro antes de fechar.

### 🟢 5.4 Filtros fixos no desktop
Em 1920px, a sidebar tem um vazio grande entre a navegação e o rodapé.

- **Sugestão:** a partir de `2xl`, os filtros ficam sempre visíveis na sidebar, sem precisar do popover.

---

## 6. Detalhes do evento

### 🔴 6.1 Ações empilhadas com larguras diferentes (celular)
Google Agenda, Apple/Outlook (.ics) e Compartilhar são três botões de larguras diferentes, um embaixo do outro e alinhados à esquerda.

- **Sugestão:** os três com largura total (`w-full`) numa coluna;
- ou Google/.ics lado a lado (`grid-cols-2`) e Compartilhar abaixo.

### 🟡 6.2 Ação principal fora da tela
Em eventos com local e preço, os botões ficam no meio da página. No painel do desktop, o "Compartilhar" fica escondido (é preciso rolar dentro do painel).

- **Sugestão:** barra de ações fixa no rodapé do drawer/painel, com "Adicionar à agenda" (abre as opções) e "Compartilhar" como ícone.

### 🟡 6.3 Descrição crua
- Perfis do Instagram repetidos ("@tropicavana_bar" duas vezes) e linhas em branco.
- **Sugestão:** juntar menções repetidas e mostrar perfis citados como chips com avatar/ícone (há dados em `promoters.json`). A descrição pode ficar recolhida em ~6 linhas com "Ver mais".

### 🟡 6.4 Detalhes menores
- **"Abrir no mapa":** fica recuado e solto. Alinhar com o texto do endereço, ou virar um botão secundário pequeno.
- **Cabeçalho do drawer:** "Detalhes do evento" é genérico. Mostrar o nome do evento, truncado, quando o título rolar para fora da tela.

---

## 7. Mapa

### 🟡 7.1 Pinos sobrepostos
Eventos no mesmo local, ou muito próximos, ficam um em cima do outro (Lisboa centro).

- **Sugestão:** agrupar com um número ("3"), que abre a lista ao tocar. Opção: `leaflet.markercluster` ou agrupamento por local.

### 🟡 7.2 Enquadramento inicial
Se um evento for no Porto, o /map abre mostrando Portugal inteiro e os pinos de Lisboa ficam minúsculos.

- **Sugestão:** enquadrar a região de Lisboa e mostrar um chip "+1 fora da região" que leva ao pino.

### 🟢 7.3 Carrossel do /map
- Indicar posição e total ("2 de 6").
- O card ativo já tem o contorno roxo; os outros poderiam ficar levemente esmaecidos.

### 🟢 7.4 Atribuição do Leaflet
Fica branca no tema escuro.

- **Sugestão:** `.leaflet-control-attribution` com `--surface`/`--fg-muted`, como foi feito com os botões de zoom.

---

## 8. Comunidade

### 🟡 8.1 Listas sem identidade
São linhas de texto com ↗. Usar a paleta de gêneros que o app já tem:

- **grupos do WhatsApp:** o chip colorido do gênero ("Forró", "Salsa"…) no lugar do texto puro;
- **calendários:** ícone/emoji do conjunto.

### 🟡 8.2 Três ações por linha em "Assinar no app de agenda"
"Assinar", copiar e abrir aparecem lado a lado, e os ícones de copiar e abrir não dizem o que fazem.

- **Sugestão:** "Assinar" como botão secundário e "copiar link" como ícone com tooltip. "Abrir" pode sair, porque assinar já abre.
- No celular, o nome do calendário quebra em 2 linhas ("Pas de Deux / Brasileiras"). Ações abaixo do nome resolvem.

---

## 9. Sobre

### 🟡 9.1 Ajustes
- Tema e Idioma usam o `Segmented` antigo (ver 1.2).
- **Tema:** ícones (☀️ claro, 🌙 escuro, 🖥 sistema) ajudam a ler rápido.
- **"Conexão: Online":** ocupa um card inteiro para informar o óbvio. Mostrar só quando estiver offline (um banner global já faz isso melhor).
- **"Instalar o app":** parece um card informativo, mas é uma ação. Usar botão com ícone (download/celular) e uma frase de benefício ("Abre mais rápido e funciona offline").

### 🟢 9.2 Créditos
O texto "Agenda de práticas… mantido por @ateterca" é longo para o card de topo.

- **Sugestão:** um card "Fontes" com a lista de calendários (logo/ícone + link), e "Desenvolvido por" no rodapé junto da versão.

---

## 10. Estados (vazio, erro, 404, carregando)

### 🟡 10.1 404 e erro
O 404 é um "404" grande com um link solto. Sugestões:

- ilustração ou emoji;
- frase amigável;
- atalhos para Agenda e Comunidade como botões do tema.

A página de erro usa um botão feito à mão (1.2).

### 🟡 10.2 Estados vazios
"Nenhum evento" usa o ícone do Lucide, cinza e pequeno.

- **Sugestão:** ícone Phosphor maior em roxo claro, título curto e o botão "Procurar mais adiante" como principal.

### 🟢 10.3 Skeleton
Ele já segue o card. Pode ganhar a moldura de 2px, porque hoje parece um card "sem borda" piscando.

---

## 11. Tipografia e legibilidade

### 🟡 11.1 Texto pequeno demais no celular
Local, horário, preço e textos de apoio estão em `text-sm` (14px) e `text-xs` (12px, dia da semana na faixa e chips de preço), muitos em `fg-muted`.

- **Sugestão:** 15–16px para local e horário no celular, e nada abaixo de 13px.

### 🟢 11.2 Fredoka nos números
Os números da faixa de dias e os horários usam Nunito com `tabular-nums`, o que está bom. O título do dia e o título do card estão em Fredoka. Conferir se o dia da faixa (o número) em Fredoka bold fica melhor.

---

## 12. Acessibilidade (para conferir)

- **Contraste:**
  - textos `fg-muted` em `text-xs` (chips de preço, "Ver descrição") no claro e no escuro;
  - texto branco no rosa do Tango e no verde-oliva de "Tradicionais".
  - Rodar o `scripts/a11y-check.mjs` depois das mudanças acima (ou o Playwright + axe, item 8 do TODO).
- **Movimento:** o "afundar" dos botões e as transições respeitam `prefers-reduced-motion` (há regra global). Manter isso nos componentes novos.
- **Calendário próprio (4.4):** se for feito, precisa de navegação por setas e `aria-selected`/`aria-current`.

---

## Ordem sugerida

1. **Rápido e visível:** 1.1 (ícones), 1.2 (controles antigos), 1.3 (sombras), 2.1 (título no celular) e 6.1 (ações dos detalhes).
2. **Layout:** 3.1 (cards no `xl`), 3.2 (ícone ↗), 3.3 (títulos dos dias), 4.5 (atalhos na sidebar) e 5.1 (distâncias).
3. **Refinamento:** 1.4, 1.5, 2.3, 4.1, 6.2, 6.3, 8.x, 9.1 e 10.x.
4. **Ideias:** 3.4, 4.3/4.4, 5.3/5.4, 7.x e 9.2.
