// Paletas de cor dos estilos para comparar na página /test/genre-colors. Só a página de teste usa:
// o app continua com src/domain/genres.ts e src/index.css até a escolha.

type FamilyId = 'latinas' | 'afro' | 'br' | 'american' | 'salao' | 'tradicionais'

export type Family = { id: FamilyId; name: string; umbrella?: string; genres: string[]; note?: string }

/**
 * Famílias (conjuntos do filtro). Latinas, Afro e BR continuam como estão; Swing (com Blues e West
 * Coast Swing) e Salão (Tango e Bolero) são novas; Tradicionais fica sozinha.
 */
export const FAMILIES: Family[] = [
  { id: 'latinas', name: 'Latinas', umbrella: 'Latinas', genres: ['Salsa', 'Salsa Cubana', 'Bachata', 'Merengue'] },
  { id: 'afro', name: 'Afro', umbrella: 'Afro', genres: ['Kizomba', 'Semba', 'Urban Kiz'] },
  { id: 'br', name: 'BR', umbrella: 'BR', genres: ['Forró', 'Zouk', 'Samba'] },
  {
    id: 'american',
    name: 'American',
    umbrella: 'American',
    genres: ['Swing', 'Balboa', 'Blues', 'West Coast Swing'],
    note: 'Nova (já no app). Blues e Balboa são estilos próprios (Balboa também conta como Swing); Shag e Lindy Hop entram como "Swing". West Coast Swing vem da família do swing e saiu de "Outros".',
  },
  {
    id: 'salao',
    name: 'Salão',
    umbrella: 'Salão',
    genres: ['Tango', 'Bolero'],
    note: 'Nova (já no app). Danças de abraço fechado, de "gala": ficam juntas para dividir o mesmo tom (o lilás do Tango).',
  },
  { id: 'tradicionais', name: 'Tradicionais', genres: ['Tradicionais'] },
]

export const ALL_GENRES = FAMILIES.flatMap((family) => [...(family.umbrella ? [family.umbrella] : []), ...family.genres])

export type Swatch = {
  bg: string
  /** Cor do texto; sem ela, a página escolhe preto ou branco pelo contraste. */
  fg?: string
  /** No tema escuro, quando muda (a paleta original clareia as cores muito escuras). */
  dark?: string
  /** Por que esta cor (curto). */
  why?: string
}

export type Palette = {
  id: string
  name: string
  summary: string
  /** O raciocínio da paleta inteira. */
  idea: string[]
  colors: Record<string, Swatch>
  /** Problemas que a análise automática não pega. */
  notes?: string[]
}

/** As 11 cores de evento do Google Agenda: o limite do calendário do Pas de Deux. */
export const GOOGLE = {
  Tomate: '#d50000',
  Flamingo: '#e67c73',
  Tangerina: '#f4511e',
  Banana: '#f6bf26',
  Sálvia: '#33b679',
  Manjericão: '#0b8043',
  Pavão: '#039be5',
  Mirtilo: '#3f51b5',
  Lavanda: '#7986cb',
  Uva: '#8e24aa',
  Grafite: '#616161',
} as const

const g = (name: keyof typeof GOOGLE, why?: string): Swatch => ({ bg: GOOGLE[name], why: why ? `${name}: ${why}` : name })

export const PALETTES: Palette[] = [
  {
    id: 'original',
    name: '1. Original (a do app até 27/11)',
    summary: 'Cada conjunto nas cores da bandeira do país de origem.',
    idea: [
      'Latinas no azul e vermelho da República Dominicana, Afro no preto, amarelo e terracota de Angola, BR no verde e amarelo do Brasil.',
      'Os outros estilos usam as cores que sobravam (ardósia, magenta, laranja, lavanda, oliva), sem relação entre si.',
      'American (Swing, Blues, West Coast Swing) e Salão (Tango, Bolero) já existem no app, com cores provisórias: azul dos EUA, índigo e ameixa.',
    ],
    colors: {
      Latinas: { bg: '#002d62', fg: '#ffffff', dark: '#2f5597', why: 'Azul da bandeira dominicana' },
      Salsa: { bg: '#c62828', fg: '#ffffff', why: 'Vermelho dominicano' },
      'Salsa Cubana': { bg: '#8e1b3a', fg: '#ffffff', dark: '#b0345c', why: 'Vinho: variação da Salsa' },
      Bachata: { bg: '#1d4ed8', fg: '#ffffff', dark: '#3b6fe0', why: 'Azul real' },
      Merengue: { bg: '#9cc3eb', fg: '#0b2a4a', why: 'Azul claro' },
      Afro: { bg: '#1c1c1c', fg: '#ffcb00', dark: '#454545', why: 'Preto e amarelo de Angola' },
      Kizomba: { bg: '#ffcb00', fg: '#1c1c1c', why: 'Amarelo de Angola' },
      Semba: { bg: '#b4441c', fg: '#ffffff', why: 'Terracota' },
      'Urban Kiz': { bg: '#5d3a1a', fg: '#ffffff', dark: '#8a5a2b', why: 'Chocolate' },
      BR: { bg: '#ffdf00', fg: '#00502a', why: 'Amarelo e verde do Brasil' },
      Forró: { bg: '#84cc16', fg: '#1a2e05', why: 'Verde-limão' },
      Zouk: { bg: '#0f766e', fg: '#ffffff', why: 'Verde-azulado' },
      Samba: { bg: '#007a2f', fg: '#ffffff', why: 'Verde da bandeira' },
      American: { bg: '#3c3b6e', fg: '#ffffff', dark: '#5654a0', why: 'Azul dos EUA (família nova)' },
      Swing: { bg: '#52606d', fg: '#ffffff', why: 'Ardósia (o roxo é a cor do app)' },
      Blues: { bg: '#3730a3', fg: '#ffffff', dark: '#5a51cf', why: 'Índigo (estilo novo)' },
      'West Coast Swing': { bg: '#e8742a', fg: '#2a1300', why: 'Laranja (sobra)' },
      Salão: { bg: '#6b2150', fg: '#ffffff', dark: '#8e3a70', why: 'Ameixa (família nova)' },
      Tango: { bg: '#c2306f', fg: '#ffffff', why: 'Magenta (sobra)' },
      Bolero: { bg: '#c4b5fd', fg: '#2e1065', why: 'Lavanda (sobra)' },
      Tradicionais: { bg: '#556b2f', fg: '#ffffff', why: 'Oliva (sobra)' },
    },
    notes: [
      'Não conversa com o calendário do Pas de Deux: quem usa os dois vê Kizomba amarela aqui e cinza lá.',
      'As cores de "sobra" não têm motivo, então ninguém as associa ao estilo.',
    ],
  },
  {
    id: 'terca',
    name: '2. Sugestão do Terça (cores do Google Agenda)',
    summary: 'A mesma cor do calendário do Pas de Deux, limitada às 11 cores de evento do Google Agenda.',
    idea: [
      'Swing laranja (Tangerina), Brasileiras amarelo (Banana), Tango lilás (Lavanda), Tradicionais verde (Manjericão) e as Afro-latinas em cinza (Grafite).',
      'O Google Agenda só tem 11 cores e nenhuma variação de tom. Por isso as nuances que ele pediu (Blues mais escuro, Samba num tom diferente, Kizomba quase preta) não existem lá: os estilos de cada família ficam com a mesma cor.',
      'Zouk e West Coast Swing ficam no cinza, como no calendário, mesmo estando em outras famílias aqui.',
      'Bolero não foi citado: ficou com Uva, perto do lilás do Tango.',
    ],
    colors: {
      Latinas: g('Grafite', 'afro-latinas, noite'),
      Salsa: g('Grafite', 'o cinza principal'),
      'Salsa Cubana': g('Grafite'),
      Bachata: g('Grafite'),
      Merengue: g('Grafite'),
      Afro: g('Grafite'),
      Kizomba: g('Grafite', 'seria o mais escuro, mas o Google não tem'),
      Semba: g('Grafite'),
      'Urban Kiz': g('Grafite'),
      BR: g('Banana', 'sol, brasileiras'),
      Forró: g('Banana', 'a primeira, amarelo'),
      Zouk: g('Grafite', 'no calendário fica nas afro-latinas'),
      Samba: g('Banana', 'seria outro tom, mas o Google não tem'),
      American: g('Tangerina'),
      Swing: g('Tangerina', 'laranja do swing'),
      Blues: g('Tangerina', 'seria mais escuro, mas o Google não tem'),
      'West Coast Swing': g('Grafite', 'no calendário fica nas afro-latinas'),
      Salão: g('Lavanda'),
      Tango: g('Lavanda', 'lilás, sóbrio e de gala'),
      Bolero: g('Uva', 'não citado'),
      Tradicionais: g('Manjericão', 'as florestas, o antigo'),
    },
    notes: [
      'Com 9 estilos em Grafite, o cinza vira a cor da maior parte da agenda: numa sexta à noite, quase todos os cards ficam cinza.',
      'Faz sentido no calendário (lá a cor separa famílias numa grade de horários). Aqui, a cor é o que diferencia os estilos lado a lado.',
    ],
  },
  {
    id: 'porques',
    name: '3. Pelos porquês do Terça (sem o limite do Google)',
    summary: 'Os mesmos motivos (sol, gala, floresta, noite intimista), com liberdade de tom e a "noite" em cores escuras em vez de cinza.',
    idea: [
      'Swing: laranja de dança alegre e saltada; Blues num laranja queimado, mais escuro e intimista, como ele pediu.',
      'Brasileiras: sol. Forró no amarelo puro (a primeira), Samba no âmbar, Zouk (noite) num petróleo profundo.',
      'Salão: lilás de gala para o Tango, um lilás claro para o Bolero.',
      'Tradicionais: verde-floresta.',
      'Afro-latinas: a noite e o ritmo forte. Em vez de cinza, azul-noite, ameixa e vinho escuros (cores de noite que não parecem "desligadas"). Salsa é o tom principal e Kizomba é o mais escuro, quase preto, com o texto dourado ("a mais caliente").',
    ],
    colors: {
      Latinas: { bg: '#2b2d42', why: 'Noite' },
      Salsa: { bg: '#3d3f6b', why: 'Azul-noite: o tom principal' },
      'Salsa Cubana': { bg: '#5a2a4a', why: 'Ameixa: variação da Salsa' },
      Bachata: { bg: '#24456b', why: 'Azul de madrugada' },
      Merengue: { bg: '#5b6c9e', why: 'Mais claro e rápido' },
      Afro: { bg: '#1d1a17', fg: '#f5b700', why: 'Noite fechada' },
      Kizomba: { bg: '#0f0f0f', fg: '#ffcc33', why: 'O mais escuro: "a mais caliente"' },
      Semba: { bg: '#4a2c1a', fg: '#ffd27a', why: 'Raiz, terra escura' },
      'Urban Kiz': { bg: '#2e2440', why: 'Noite urbana' },
      BR: { bg: '#f5b700', why: 'Sol' },
      Forró: { bg: '#ffd21f', why: 'Amarelo puro: a primeira' },
      Zouk: { bg: '#1f4b57', why: 'Noite, fluido (petróleo)' },
      Samba: { bg: '#f59e0b', why: 'Âmbar: o tom "um bocadinho diferente"' },
      American: { bg: '#e8731a', why: 'Laranja' },
      Swing: { bg: '#f28c28', why: 'Laranja alegre' },
      Blues: { bg: '#9a3412', why: 'Laranja queimado: mais escuro e intimista' },
      'West Coast Swing': { bg: '#b5501a', why: 'Laranja mais sóbrio' },
      Salão: { bg: '#7e57c2', why: 'Lilás' },
      Tango: { bg: '#6a4c9c', why: 'Lilás de gala' },
      Bolero: { bg: '#cbb8ea', why: 'Lilás claro, romântico' },
      Tradicionais: { bg: '#2e6b3a', why: 'Verde-floresta' },
    },
    notes: [
      'As cores escuras das afro-latinas somem no tema escuro (fundo azul-marinho): precisariam de uma versão mais clara lá.',
      'Ainda há tons parecidos dentro da "noite": o nome do estilo na tag continua sendo o que diferencia.',
    ],
  },
  {
    id: 'percepcao',
    name: '4. Como os estilos são vistos',
    summary: 'A "personalidade" de cada dança, como a comunidade costuma descrevê-la, sem pensar em família.',
    idea: [
      'Salsa: quente, picante, vermelho. Salsa Cubana: mais de rua e de raiz, telha. Bachata: romântica, rosa. Merengue: rápido e alegre, turquesa do Caribe.',
      'Kizomba: sensual e íntima, preto-cereja. Semba: festa e alegria, dourado. Urban Kiz: urbana e moderna, azul-noite com texto neon.',
      'Forró: festa junina e chita, laranja. Samba: carnaval, verde. Zouk: ondulado e fluido, azul-oceano.',
      'Swing: vintage e alegre, mostarda. Blues: o próprio nome, índigo. West Coast Swing: moderno e suave, framboesa.',
      'Tango: preto e vermelho. Bolero: rosa romântico. Tradicionais: verde folk.',
    ],
    colors: {
      Latinas: { bg: '#b71c1c', why: 'Calor latino' },
      Salsa: { bg: '#d32f2f', why: 'Quente, picante' },
      'Salsa Cubana': { bg: '#a0401a', why: 'Raiz, rua, rumba' },
      Bachata: { bg: '#c2185b', why: 'Romântica' },
      Merengue: { bg: '#00acc1', why: 'Rápido e alegre, Caribe' },
      Afro: { bg: '#1b1b1b', fg: '#f9a825', why: 'Noite' },
      Kizomba: { bg: '#3b0a2a', why: 'Sensual, íntima' },
      Semba: { bg: '#f9a825', why: 'Festa, alegria' },
      'Urban Kiz': { bg: '#102a43', fg: '#4dd0e1', why: 'Urbana, moderna (neon)' },
      BR: { bg: '#1b5e20', fg: '#ffdf00', why: 'Brasil' },
      Forró: { bg: '#ff8f00', why: 'Festa junina, chita' },
      Zouk: { bg: '#00838f', why: 'Fluido, ondulado' },
      Samba: { bg: '#2e7d32', why: 'Carnaval' },
      American: { bg: '#6d4c41', why: 'Vintage' },
      Swing: { bg: '#e0a82e', why: 'Vintage, alegre' },
      Blues: { bg: '#1a237e', why: 'Blue: o nome' },
      'West Coast Swing': { bg: '#ad1457', why: 'Moderno, suave' },
      Salão: { bg: '#4a1010', why: 'Gala' },
      Tango: { bg: '#212121', fg: '#ff5252', why: 'Preto e vermelho' },
      Bolero: { bg: '#f8bbd0', fg: '#880e4f', why: 'Romântico' },
      Tradicionais: { bg: '#4a7c28', why: 'Folk, campo' },
    },
    notes: [
      'Cada estilo fica fácil de reconhecer sozinho, mas as famílias se perdem: Latinas vão do vermelho ao turquesa e BR do laranja ao azul.',
      'Bachata (rosa) e West Coast Swing (framboesa) ficam parecidas.',
    ],
  },
  {
    id: 'associadas',
    name: '5. Cores comumente associadas (origem e nome)',
    summary: 'A associação mais literal: a bandeira do país de origem de cada estilo, ou a cor que está no nome.',
    idea: [
      'Salsa (Cuba / Nova York): vermelho. Salsa Cubana: o azul de Cuba. Bachata e Merengue (República Dominicana): azul e vermelho dominicanos.',
      'Kizomba e Semba (Angola): preto e vermelho angolanos. Urban Kiz (nasceu em França): azul francês.',
      'Forró (Nordeste): amarelo. Samba: verde do Brasil. Zouk (Antilhas): azul do mar das Antilhas.',
      'Swing e West Coast Swing (EUA): vermelho americano e o dourado da Califórnia. Blues: azul, pelo nome.',
      'Tango (Argentina): celeste. Bolero (Cuba / México): verde mexicano. Tradicionais (Portugal): verde-bandeira.',
    ],
    colors: {
      Latinas: { bg: '#002d62', why: 'República Dominicana' },
      Salsa: { bg: '#cf142b', why: 'Cuba / Nova York' },
      'Salsa Cubana': { bg: '#002a8f', why: 'Azul de Cuba' },
      Bachata: { bg: '#003a80', why: 'Azul dominicano' },
      Merengue: { bg: '#ce1126', why: 'Vermelho dominicano' },
      Afro: { bg: '#000000', fg: '#ffcb00', why: 'Angola' },
      Kizomba: { bg: '#111111', fg: '#ffcb00', why: 'Angola (preto)' },
      Semba: { bg: '#cc092f', why: 'Angola (vermelho)' },
      'Urban Kiz': { bg: '#0055a4', why: 'França' },
      BR: { bg: '#00843d', why: 'Brasil' },
      Forró: { bg: '#ffdf00', fg: '#00502a', why: 'Nordeste, sol' },
      Zouk: { bg: '#0072bb', why: 'Mar das Antilhas' },
      Samba: { bg: '#009c3b', why: 'Verde do Brasil' },
      American: { bg: '#3c3b6e', why: 'EUA' },
      Swing: { bg: '#b22234', why: 'EUA (vermelho)' },
      Blues: { bg: '#1e40af', why: 'Blue' },
      'West Coast Swing': { bg: '#f4a300', why: 'Califórnia (dourado)' },
      Salão: { bg: '#74acdf', why: 'Argentina' },
      Tango: { bg: '#74acdf', why: 'Argentina (celeste)' },
      Bolero: { bg: '#006847', why: 'México' },
      Tradicionais: { bg: '#046a38', why: 'Portugal' },
    },
    notes: [
      'Muitos estilos vêm dos mesmos países, então as cores se repetem: vários vermelhos (Salsa, Merengue, Semba, Swing) e vários azuis (Salsa Cubana, Bachata, Urban Kiz, Zouk, Blues).',
      'Quem dança não pensa na bandeira: Swing vermelho ou Tango celeste não "lembram" o estilo.',
    ],
  },
  {
    id: 'sugestao',
    name: '6. Minha sugestão',
    summary: 'As famílias do Terça (laranja, amarelo, lilás, verde, noite), com um tom por estilo, sem cinza e sem o roxo do app.',
    idea: [
      'Mesma ideia do Pas de Deux, para quem vê os dois reconhecer: Swing laranja, BR amarelo, Salão lilás, Tradicionais verde, e as noturnas escuras.',
      'Família = matiz; estilo = tom. Dentro de cada família os tons variam de claro a escuro, para dois estilos da mesma família não ficarem iguais no mesmo card.',
      'As noturnas sem cinza: Latinas nos azuis e vinhos da noite (mantém a origem dominicana), Afro no preto com texto dourado (Kizomba o mais escuro, como ele pediu). Escuro saturado ou com texto colorido não parece "desativado".',
      'Zouk, na BR, fica num petróleo escuro: liga com a noite (como no calendário) sem sair do conjunto.',
      'O lilás do Tango puxa para o rosa (malva), longe do roxo-azulado do app (#6d3fd9), que marca seleção e links.',
      'Mesmo quando a família é igual à do calendário, os tons são mais ricos que os 11 do Google: o app pode ser mais fino que o calendário sem desalinhar.',
    ],
    colors: {
      Latinas: { bg: '#002d62', dark: '#2f5597', why: 'Noite, azul dominicano' },
      Salsa: { bg: '#b3261e', why: 'O tom principal: vermelho de noite' },
      'Salsa Cubana': { bg: '#7a1630', dark: '#a3324f', why: 'Vinho: variação da Salsa' },
      Bachata: { bg: '#1e3a8a', dark: '#3b5fc0', why: 'Azul-noite' },
      Merengue: { bg: '#3b6ea8', why: 'Azul mais claro, mais rápido' },
      Afro: { bg: '#2a2118', fg: '#ffcb00', dark: '#4a3b2a', why: 'Noite, dourado de Angola' },
      Kizomba: { bg: '#0d0d0d', fg: '#ffd54f', dark: '#000000', why: 'O mais escuro: "a mais caliente"' },
      Semba: { bg: '#6b3e12', why: 'Terra, raiz' },
      'Urban Kiz': { bg: '#3a2c4a', dark: '#57456e', why: 'Noite urbana, ameixa' },
      BR: { bg: '#ffdf00', fg: '#00502a', why: 'Sol, com o verde do Brasil' },
      Forró: { bg: '#ffd000', why: 'Amarelo: a primeira' },
      Zouk: { bg: '#1f4e5a', dark: '#2f6e7e', why: 'Petróleo: liga com a noite' },
      Samba: { bg: '#f0a500', why: 'Âmbar: o tom diferente' },
      American: { bg: '#c2410c', why: 'Laranja' },
      Swing: { bg: '#f08a24', why: 'Laranja alegre' },
      Blues: { bg: '#9a3412', why: 'Laranja queimado: mais escuro' },
      'West Coast Swing': { bg: '#d9622b', why: 'Laranja intermediário' },
      Salão: { bg: '#8a4a87', why: 'Malva' },
      Tango: { bg: '#a05195', why: 'Lilás-malva, de gala' },
      Bolero: { bg: '#d7b8e8', fg: '#3b1d4a', why: 'Lilás claro, romântico' },
      Tradicionais: { bg: '#2e6b3a', dark: '#3f8a4d', why: 'Verde-floresta' },
    },
    notes: [
      'Ainda falta ajustar a versão de cada cor no tema escuro e testar numa noite cheia de eventos.',
      'Se o Terça quiser algo mais perto do calendário dele, dá para usar as cores do Google como base e só variar o tom dentro de cada família.',
    ],
  },
  {
    id: 'setima',
    name: '7. Nova proposta (cores escolhidas)',
    summary: 'Cores escolhidas para 10 estilos; os outros seguem um tom parecido com o das irmãs da mesma família.',
    idea: [
      'Escolhidas: Swing #FF5722, Blues #D50000, Forró #FFD600, Samba #e4c441, Tradicionais #009688, Tango #8E24AA, Kizomba e Zouk #616161, West Coast Swing #4e2121 e Salsa #0B8043.',
      'Latinas no verde da Salsa: Salsa Cubana, Bachata e Merengue em verdes vizinhos (mais escuro, azulado e mais claro); o conjunto, no verde mais fechado.',
      'Afro no cinza da Kizomba: Semba e Urban Kiz em cinzas próximos (mais quente e mais escuro); o conjunto, no grafite.',
      'BR no amarelo do Forró e do Samba: o conjunto num amarelo entre os dois. Zouk fica no cinza escolhido.',
      'American entre o laranja do Swing e o vermelho do Blues; Salão no roxo do Tango, com o Bolero num roxo mais claro.',
    ],
    colors: {
      Latinas: { bg: '#06572c', why: 'Derivada: verde mais fechado da Salsa' },
      Salsa: { bg: '#0b8043', why: 'Escolhida' },
      'Salsa Cubana': { bg: '#0a6b38', why: 'Derivada: verde da Salsa, mais escuro' },
      Bachata: { bg: '#00796b', why: 'Derivada: verde da Salsa, mais azulado' },
      Merengue: { bg: '#2e9e5b', why: 'Derivada: verde da Salsa, mais claro' },
      Afro: { bg: '#424242', why: 'Derivada: grafite, cinza da Kizomba mais escuro' },
      Kizomba: { bg: '#616161', why: 'Escolhida' },
      Semba: { bg: '#6d5f57', why: 'Derivada: cinza da Kizomba, mais quente' },
      'Urban Kiz': { bg: '#4f5559', why: 'Derivada: cinza da Kizomba, mais frio e escuro' },
      BR: { bg: '#f2cc22', why: 'Derivada: entre o amarelo do Forró e o do Samba' },
      Forró: { bg: '#ffd600', why: 'Escolhida' },
      Zouk: { bg: '#616161', why: 'Escolhida' },
      Samba: { bg: '#e4c441', why: 'Escolhida' },
      American: { bg: '#c63a10', why: 'Derivada: entre o laranja do Swing e o vermelho do Blues' },
      Swing: { bg: '#ff5722', why: 'Escolhida' },
      Blues: { bg: '#d50000', why: 'Escolhida' },
      'West Coast Swing': { bg: '#4e2121', why: 'Escolhida' },
      Salão: { bg: '#7b1fa2', why: 'Derivada: roxo do Tango, mais fechado' },
      Tango: { bg: '#8e24aa', why: 'Escolhida' },
      Bolero: { bg: '#b46ac6', why: 'Derivada: roxo do Tango, mais claro' },
      Tradicionais: { bg: '#009688', why: 'Escolhida' },
    },
    notes: [
      'Kizomba e Zouk têm exatamente a mesma cor, e estão em famílias diferentes (Afro e BR).',
      'Salsa verde e Tradicionais verde-azulado (#009688) ficam perto; Bachata, derivada da Salsa, também puxa para esse tom.',
    ],
  },
  {
    id: 'final',
    name: '8. Versão final (no app desde 27/11)',
    summary:
      'Cópia da paleta 6 (Minha sugestão) para os ajustes finais: o que for decidido aqui vai para o app (src/domain/genres.ts e src/index.css).',
    idea: [
      'Mesma ideia do Pas de Deux, para quem vê os dois reconhecer: American azul (por causa do Blues; no calendário o Swing é laranja), BR amarelo, Salão petróleo, Tradicionais verde, e as noturnas escuras.',
      'Família = matiz; estilo = tom. Dentro de cada família os tons variam de claro a escuro, para dois estilos da mesma família não ficarem iguais no mesmo card.',
      'As noturnas sem cinza: Latinas em vermelhos e vinho (o conjunto num vermelho fechado, o tom das filhas), Afro no preto com texto dourado (Kizomba o mais escuro, como ele pediu). Escuro saturado ou com texto colorido não parece "desativado".',
      'Bachata e Zouk, as mais sensuais, em rosas vizinhos (framboesa e ameixa), mesmo estando em famílias diferentes (Latinas e BR): parecidos de propósito, mas distinguíveis lado a lado.',
      'Salão em petróleo e esmeralda (elegante, noturno), um espaço livre na paleta: longe do roxo do app e dos rosas da Bachata e do Zouk.',
      'Mesmo quando a família é igual à do calendário, os tons são mais ricos que os 11 do Google: o app pode ser mais fino que o calendário sem desalinhar.',
    ],
    colors: {
      Latinas: { bg: '#8f1d1d', why: 'Vermelho fechado: o tom das filhas (Salsa, Salsa Cubana, Merengue)' },
      Salsa: { bg: '#b3261e', why: 'O tom principal: vermelho de noite' },
      'Salsa Cubana': { bg: '#7a1630', dark: '#a3324f', why: 'Vinho: variação da Salsa' },
      Bachata: { bg: '#b8336a', why: 'Rosa-framboesa: sensual (par com o Zouk)' },
      Merengue: { bg: '#c2461d', why: 'Vermelho-alaranjado: parente da Salsa, mais rápido e alegre' },
      Afro: { bg: '#2a2118', fg: '#ffcb00', dark: '#4a3b2a', why: 'Noite, dourado de Angola' },
      Kizomba: { bg: '#0d0d0d', fg: '#ffd54f', dark: '#000000', why: 'O mais escuro: "a mais caliente"' },
      Semba: { bg: '#6b3e12', why: 'Terra, raiz' },
      'Urban Kiz': { bg: '#3a2c4a', dark: '#57456e', why: 'Noite urbana, ameixa' },
      BR: { bg: '#ffdf00', fg: '#00502a', why: 'Sol, com o verde do Brasil' },
      Forró: { bg: '#ffd000', why: 'Amarelo: a primeira' },
      Zouk: { bg: '#8f2d63', why: 'Rosa-ameixa: sensual, um tom mais fechado que a Bachata' },
      Samba: { bg: '#f0a500', why: 'Âmbar: o tom diferente' },
      American: { bg: '#0e5a8a', why: 'Azul: a família do Blues' },
      Swing: { bg: '#1565c0', why: 'Azul vivo: alegre, saltado' },
      Balboa: { bg: '#8db9e3', fg: '#0b2a4a', why: 'Azul-claro: variação do Swing, mais suave' },
      Blues: { bg: '#174a7c', why: 'Azul profundo: o "blue" do nome, mais intimista' },
      'West Coast Swing': { bg: '#3949ab', why: 'Azul-índigo: moderno, suave' },
      Salão: { bg: '#0f5257', why: 'Petróleo: elegante e noturno' },
      Tango: { bg: '#0b6e6e', why: 'Esmeralda escuro: gala' },
      Bolero: { bg: '#7cc4b8', why: 'Verde-água claro: romântico, mais leve' },
      Tradicionais: { bg: '#2e6b3a', dark: '#3f8a4d', why: 'Verde-floresta' },
    },
    notes: [
      'American em azul (por causa do Blues): Swing azul vivo, Blues azul profundo, West Coast Swing índigo.',
      'Ainda falta ajustar a versão de cada cor no tema escuro e testar numa noite cheia de eventos.',
      'Se o Terça quiser algo mais perto do calendário dele, dá para usar as cores do Google como base e só variar o tom dentro de cada família.',
    ],
  },
]

/** Proposta para o Google Agenda do Pas de Deux: a versão final traduzida para as 11 cores de evento do Google. */
PALETTES.push({
  id: 'google',
  name: '9. Proposta para o Google Agenda (a partir da 8)',
  summary:
    'A versão final traduzida para as 11 cores de evento do Google Agenda: mesma família de cor, para quem olha o calendário e o app reconhecer.',
  idea: [
    'O Google só tem 11 cores e nenhum tom intermediário. A regra foi: a cor do Google mais próxima de cada estilo, ajustada para cada família ficar numa cor (ou em duas vizinhas) e as 11 serem usadas.',
    'Latinas no vermelho: Salsa, Salsa Cubana e o conjunto em Tomate; Merengue em Tangerina (vermelho-alaranjado); Bachata em Flamingo (rosa).',
    'Zouk também em Flamingo: o par sensual com a Bachata, como na versão final.',
    'Afro em Grafite (o único tom escuro do Google), com Urban Kiz em Uva (a ameixa da versão final).',
    'BR em Banana. American nos azuis: Swing, Balboa e o conjunto em Pavão, Blues em Mirtilo, West Coast Swing em Lavanda.',
    'Salão em Sálvia (o verde-água mais próximo do petróleo); Tradicionais em Manjericão (verde-floresta), para não confundir com o Salão.',
    'Evento com estilos de famílias diferentes (ex.: SBK): a cor da família do primeiro estilo da tag.',
  ],
  colors: {
    Latinas: g('Tomate'),
    Salsa: g('Tomate'),
    'Salsa Cubana': g('Tomate', 'variação da Salsa'),
    Bachata: g('Flamingo', 'rosa, par com o Zouk'),
    Merengue: g('Tangerina', 'vermelho-alaranjado'),
    Afro: g('Grafite'),
    Kizomba: g('Grafite'),
    Semba: g('Grafite'),
    'Urban Kiz': g('Uva', 'ameixa'),
    BR: g('Banana'),
    Forró: g('Banana'),
    Zouk: g('Flamingo', 'rosa, par com a Bachata'),
    Samba: g('Banana'),
    American: g('Pavão'),
    Swing: g('Pavão', 'azul vivo'),
    Balboa: g('Pavão', 'variação do Swing'),
    Blues: g('Mirtilo', 'azul profundo'),
    'West Coast Swing': g('Lavanda', 'azul-índigo claro'),
    Salão: g('Sálvia'),
    Tango: g('Sálvia', 'verde-água: o mais perto do petróleo'),
    Bolero: g('Sálvia'),
    Tradicionais: g('Manjericão', 'verde-floresta'),
  },
  notes: [
    'No calendário, a cor só separa famílias numa grade de horários, então cinza (Grafite) e cores repetidas não são problema lá como são no app.',
    'O Google tem dois conjuntos de cores (moderno e clássico, em Configurações): os nomes são os mesmos, os tons mudam um pouco.',
  ],
})
