import type { Venue } from '../../domain/event'

export type Platform = 'android' | 'ios' | 'other'

/** Plataforma do aparelho, para escolher o app de navegação. */
export function detectPlatform(nav: Pick<Navigator, 'userAgent' | 'maxTouchPoints'> = navigator): Platform {
  if (/android/i.test(nav.userAgent)) return 'android'
  // iPadOS se apresenta como Mac; o toque denuncia.
  if (/iphone|ipad|ipod/i.test(nav.userAgent) || (/macintosh/i.test(nav.userAgent) && nav.maxTouchPoints > 1)) {
    return 'ios'
  }
  return 'other'
}

export type NavigationLink = {
  href: string
  /** Links http abrem em nova aba; `geo:` abre o app direto. */
  external: boolean
}

/**
 * Link de "como chegar" até o local, no app de navegação do aparelho:
 * - Android: `geo:` abre o seletor de apps de navegação instalados (Google Maps, Waze…).
 * - iOS: Apple Maps com rota até o local.
 * - Outros (desktop): rota no Google Maps.
 * Usa as coordenadas quando conhecidas; senão, o nome e o endereço.
 */
export function navigationLink(
  venue: Pick<Venue, 'name' | 'address' | 'lat' | 'lng'>,
  platform: Platform = detectPlatform(),
): NavigationLink {
  const hasCoords = venue.lat !== undefined && venue.lng !== undefined
  const coords = hasCoords ? `${venue.lat},${venue.lng}` : ''
  const address = [venue.name, venue.address].filter(Boolean).join(', ')

  switch (platform) {
    case 'android': {
      // geo:lat,lng?q=lat,lng(Nome) marca o ponto com o nome; sem coordenadas, busca pelo endereço.
      const query = hasCoords ? `${coords}(${venue.name})` : address
      return { href: `geo:${hasCoords ? coords : '0,0'}?q=${encodeURIComponent(query)}`, external: false }
    }
    case 'ios': {
      const params = new URLSearchParams({ daddr: hasCoords ? coords : address, q: venue.name })
      return { href: `https://maps.apple.com/?${params}`, external: true }
    }
    default: {
      const params = new URLSearchParams({ api: '1', destination: hasCoords ? coords : address })
      return { href: `https://www.google.com/maps/dir/?${params}`, external: true }
    }
  }
}
