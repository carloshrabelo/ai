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

const ONE_DECIMAL = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const INTEGER = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

/** "350 m", "8,1 km", "42 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`
  if (km < 10) return `${ONE_DECIMAL.format(km)} km`
  return `${INTEGER.format(km)} km`
}
