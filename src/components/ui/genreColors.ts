import { type Genre, type GenreColor, genreToPalette } from '../../domain/genres'

/** Classes literais para o Tailwind encontrar no build (fundo + texto de cada gênero). */
const COLOR_CLASSES: Record<GenreColor | 'neutral', string> = {
  neutral: 'bg-genre-neutral text-genre-neutral-fg',
  'dr-navy': 'bg-genre-dr-navy text-genre-dr-navy-fg',
  red: 'bg-genre-red text-genre-red-fg',
  wine: 'bg-genre-wine text-genre-wine-fg',
  'royal-blue': 'bg-genre-royal-blue text-genre-royal-blue-fg',
  'light-blue': 'bg-genre-light-blue text-genre-light-blue-fg',
  'black-gold': 'bg-genre-black-gold text-genre-black-gold-fg',
  gold: 'bg-genre-gold text-genre-gold-fg',
  rust: 'bg-genre-rust text-genre-rust-fg',
  chocolate: 'bg-genre-chocolate text-genre-chocolate-fg',
  'br-yellow': 'bg-genre-br-yellow text-genre-br-yellow-fg',
  green: 'bg-genre-green text-genre-green-fg',
  lime: 'bg-genre-lime text-genre-lime-fg',
  teal: 'bg-genre-teal text-genre-teal-fg',
  purple: 'bg-genre-purple text-genre-purple-fg',
  magenta: 'bg-genre-magenta text-genre-magenta-fg',
  orange: 'bg-genre-orange text-genre-orange-fg',
  lavender: 'bg-genre-lavender text-genre-lavender-fg',
}

/** Classes de cor do gênero (ou neutras quando não há gênero). */
export function genreColorClasses(genre?: Genre): string {
  return COLOR_CLASSES[genre ? genreToPalette[genre] : 'neutral']
}
