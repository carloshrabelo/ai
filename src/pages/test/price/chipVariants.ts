// Variações de chips comparadas em /lab/price-formats (ver PriceChips.tsx).
import type { PriceChipVariant } from '../../../features/price/PriceChips'

export const PRICE_CHIP_VARIANTS: readonly { id: PriceChipVariant; label: string; hint: string }[] = [
  { id: 'plain', label: 'Só valores', hint: 'Um chip por valor; qualificações saem.' },
  {
    id: 'auto',
    label: 'Rótulo no chip + grupo',
    hint: 'Rótulo no chip; um valor com detalhe ("10€ (8€ bebida incluída)") fica unido ao detalhe, em grupo. É o usado no app.',
  },
  { id: 'inline', label: 'Rótulo no chip', hint: 'Valor em negrito e o rótulo ao lado, no mesmo chip.' },
  { id: 'stacked', label: 'Rótulo embaixo', hint: 'Valor em cima, rótulo pequeno embaixo.' },
  { id: 'icon', label: 'Ícone', hint: 'Rótulo como ícone (texto no title e para leitor de tela).' },
  { id: 'primary', label: 'Destaque', hint: 'O primeiro valor (o preço principal) preenchido; os outros com borda.' },
  { id: 'segmented', label: 'Grupo', hint: 'Chips unidos, separados por traço.' },
]
