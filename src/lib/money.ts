import type { Locale } from '../i18n/locale'

/** Valor em euros no formato de cada idioma: 5 → "5€" / "€5"; 7.5 → "7,50€" / "€7.50". */
export function formatEuro(value: number, locale: Locale): string {
  const number = Number.isInteger(value) ? String(value) : value.toFixed(2)
  return locale === 'pt-BR' ? `${number.replace('.', ',')}€` : `€${number}`
}
