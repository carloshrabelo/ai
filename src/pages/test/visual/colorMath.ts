// Contas de cor da página /lab/genre-colors: contraste (WCAG), saturação e distância entre cores (CIE76).

type Rgb = [number, number, number]

function rgbOf(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const linear = (channel: number) => {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const [r, g, b] = rgbOf(hex).map(linear) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contraste WCAG entre duas cores (1 a 21). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** Texto preto ou branco, o que tiver mais contraste com o fundo. */
export function autoFg(bg: string): string {
  return contrast(bg, '#ffffff') >= contrast(bg, '#1c1c1c') ? '#ffffff' : '#1c1c1c'
}

/** Saturação e luminosidade (HSL, 0 a 1). */
export function hsl(hex: string): { s: number; l: number } {
  const [r, g, b] = rgbOf(hex).map((c) => c / 255) as Rgb
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1))
  return { s, l }
}

function lab(hex: string): Rgb {
  const [r, g, b] = rgbOf(hex).map(linear) as Rgb
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

/** Distância perceptual (ΔE CIE76): abaixo de ~10, difícil de distinguir lado a lado. */
export function distance(a: string, b: string): number {
  const [l1, a1, b1] = lab(a)
  const [l2, a2, b2] = lab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}
