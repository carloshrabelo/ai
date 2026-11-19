// Tipos mínimos dos módulos de src/ que os scripts carregam pelo Vite (ssrLoadModule). Os scripts não
// importam os tipos de src/ direto: o código do app usa recursos do Vite (import.meta.env, JSON sem
// atributos) que o TypeScript do Node não aceita.

export type IsoDate = string

export type ScriptEvent = {
  slug: string
  start: Date
  end: Date
  venue?: { location: string; name: string }
}

export type DatesModule = {
  todayIso: () => IsoDate
  addDays: (date: IsoDate, days: number) => IsoDate
  lisbonDate: (at: Date) => IsoDate
}

export type LoadEventsModule = { loadEvents: (from: IsoDate, to: IsoDate) => Promise<ScriptEvent[]> }
