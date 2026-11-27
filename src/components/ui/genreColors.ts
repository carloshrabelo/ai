import type { Genre } from '../../domain/genres'

/**
 * Cor de cada estilo: classes literais para o Tailwind encontrar no build (fundo + texto). Os valores
 * estão em src/index.css (--color-genre-<estilo>), da paleta "Versão final" (/test/genre-colors):
 * Latinas em vermelhos (Bachata em rosa), Afro na noite com dourado, BR em amarelos (Zouk em rosa,
 * par com a Bachata), American em azuis, Salão em petróleo e Tradicionais em verde-floresta.
 */
const COLOR_CLASSES: Record<Genre | 'neutral', string> = {
  neutral: 'bg-genre-neutral text-genre-neutral-fg',
  Latinas: 'bg-genre-latinas text-genre-latinas-fg',
  Salsa: 'bg-genre-salsa text-genre-salsa-fg',
  'Salsa Cubana': 'bg-genre-salsa-cubana text-genre-salsa-cubana-fg',
  Bachata: 'bg-genre-bachata text-genre-bachata-fg',
  Merengue: 'bg-genre-merengue text-genre-merengue-fg',
  Afro: 'bg-genre-afro text-genre-afro-fg',
  Kizomba: 'bg-genre-kizomba text-genre-kizomba-fg',
  Semba: 'bg-genre-semba text-genre-semba-fg',
  'Urban Kiz': 'bg-genre-urban-kiz text-genre-urban-kiz-fg',
  BR: 'bg-genre-br text-genre-br-fg',
  Forró: 'bg-genre-forro text-genre-forro-fg',
  Zouk: 'bg-genre-zouk text-genre-zouk-fg',
  Samba: 'bg-genre-samba text-genre-samba-fg',
  American: 'bg-genre-american text-genre-american-fg',
  Swing: 'bg-genre-swing text-genre-swing-fg',
  Blues: 'bg-genre-blues text-genre-blues-fg',
  'West Coast Swing': 'bg-genre-wcs text-genre-wcs-fg',
  Salão: 'bg-genre-salao text-genre-salao-fg',
  Tango: 'bg-genre-tango text-genre-tango-fg',
  Bolero: 'bg-genre-bolero text-genre-bolero-fg',
  Tradicionais: 'bg-genre-tradicionais text-genre-tradicionais-fg',
}

/** Classes de cor do gênero (ou neutras quando não há gênero). */
export function genreColorClasses(genre?: Genre): string {
  return COLOR_CLASSES[genre ?? 'neutral']
}
