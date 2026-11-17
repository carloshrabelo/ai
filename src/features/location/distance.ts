export type Coords = { lat: number; lng: number }

const EARTH_RADIUS_KM = 6371

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Distância em linha reta (fórmula de Haversine), em km. */
export function distanceKm(from: Coords, to: Coords): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

const formats = new Map<string, Intl.NumberFormat>()

function unitFormat(locale: string, unit: 'kilometer' | 'meter', fractionDigits: number): Intl.NumberFormat {
  const key = `${locale}|${unit}|${fractionDigits}`
  let format = formats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(locale, {
      style: 'unit',
      unit,
      unitDisplay: 'short',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
    formats.set(key, format)
  }
  return format
}

/** Com Intl no idioma dado. pt-BR: "350 m", "8,1 km", "42 km"; en-US: "350 m", "8.1 km", "42 km". */
export function formatDistance(km: number, locale: string): string {
  if (km < 1) return unitFormat(locale, 'meter', 0).format(Math.max(10, Math.round((km * 1000) / 10) * 10))
  if (km < 10) return unitFormat(locale, 'kilometer', 1).format(km)
  return unitFormat(locale, 'kilometer', 0).format(km)
}
