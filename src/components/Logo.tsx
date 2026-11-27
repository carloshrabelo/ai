import logo64 from '../assets/logo-64.webp'
import logo128 from '../assets/logo-128.webp'
import logo192 from '../assets/logo-192.webp'
import logo256 from '../assets/logo-256.webp'

/**
 * Logo do app (decorativa: o nome vem ao lado ou no `aria-label` do link). WebP quadrado em 64 a 256 px, gerado
 * de docs/assets/logo_new.png; `size` é o tamanho exibido (em px), para o navegador baixar só a versão que
 * precisa para a densidade da tela. As antigas ficam como logo-*_legacy.webp.
 */
export function Logo({ size, className = '' }: { size: number; className?: string }) {
  return (
    <img
      src={logo128}
      srcSet={`${logo64} 64w, ${logo128} 128w, ${logo192} 192w, ${logo256} 256w`}
      sizes={`${size}px`}
      alt=""
      width={size}
      height={size}
      className={className}
    />
  )
}
