import { type Genre, type GenreColor, genreToPalette } from '../../domain/genres'

/** Classes literais para o Tailwind encontrar no build (fundo + texto de cada gênero). */
const COLOR_CLASSES: Record<GenreColor | 'neutral', string> = {
  neutral: 'bg-genre-neutral text-genre-neutral-fg',
  wine: 'bg-genre-wine text-genre-wine-fg',
  pink: 'bg-genre-pink text-genre-pink-fg',
  brown: 'bg-genre-brown text-genre-brown-fg',
  'dark-blue': 'bg-genre-dark-blue text-genre-dark-blue-fg',
  red: 'bg-genre-red text-genre-red-fg',
  yellow: 'bg-genre-yellow text-genre-yellow-fg',
  'dark-green': 'bg-genre-dark-green text-genre-dark-green-fg',
  'light-blue': 'bg-genre-light-blue text-genre-light-blue-fg',
  orange: 'bg-genre-orange text-genre-orange-fg',
  purple: 'bg-genre-purple text-genre-purple-fg',
  teal: 'bg-genre-teal text-genre-teal-fg',
  coral: 'bg-genre-coral text-genre-coral-fg',
  lime: 'bg-genre-lime text-genre-lime-fg',
  indigo: 'bg-genre-indigo text-genre-indigo-fg',
  emerald: 'bg-genre-emerald text-genre-emerald-fg',
}

/** Classes de cor do gênero (ou neutras quando não há gênero). */
export function genreColorClasses(genre?: Genre): string {
  return COLOR_CLASSES[genre ? genreToPalette[genre] : 'neutral']
}
