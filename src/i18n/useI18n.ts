import { useMemo } from 'react'
import { type Locale, useLocaleState } from './locale'
import { type Messages, MESSAGES } from './messages'

export type I18n = {
  locale: Locale
  /** Textos da interface no idioma ativo. */
  t: Messages
  /** "Salsa, Forró ou Tango" / "Salsa, Forró, or Tango" (filtro é "qualquer um"). */
  orList: (items: readonly string[]) => string
}

const orLists = new Map<Locale, Intl.ListFormat>()

/** Idioma ativo, textos e formatação de listas. Re-renderiza quando o idioma muda. */
export function useI18n(): I18n {
  const { locale } = useLocaleState()
  return useMemo(() => {
    let list = orLists.get(locale)
    if (!list) {
      list = new Intl.ListFormat(locale, { type: 'disjunction' })
      orLists.set(locale, list)
    }
    const format = list
    return { locale, t: MESSAGES[locale], orList: (items) => format.format(items) }
  }, [locale])
}
