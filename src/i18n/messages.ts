import type { Locale } from './locale'
import { en } from './messages/en'
import { type Messages, pt } from './messages/pt'

// Textos da interface por idioma: um arquivo por idioma em ./messages/ (pt.ts define o tipo).
export type { Messages }

export const MESSAGES: Record<Locale, Messages> = { 'pt-BR': pt, 'en-US': en }
