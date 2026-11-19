// Formatos comparados em /test/price-formats (ver PriceFormat.tsx).

export const PRICE_FORMATS = [
  { id: 'text', label: 'Texto (atual)', hint: 'Como está hoje: "5€ ou 10€".' },
  { id: 'dot', label: 'Separador ·', hint: 'Valores separados por ponto: "5€ · 10€".' },
  { id: 'slash', label: 'Barra /', hint: 'Como em tabela de preços: "5€ / 10€".' },
  { id: 'range', label: 'Faixa', hint: 'Do menor ao maior: "5–10€".' },
  { id: 'from', label: 'A partir de', hint: 'Só o menor: "a partir de 5€".' },
  { id: 'chips', label: 'Chips', hint: 'Cada valor numa etiqueta.' },
  { id: 'primary', label: 'Principal +N', hint: 'O primeiro valor e quantos outros há (lista no title).' },
  { id: 'stacked', label: 'Empilhado', hint: 'Um valor por linha.' },
] as const

export type PriceFormatId = (typeof PRICE_FORMATS)[number]['id']
