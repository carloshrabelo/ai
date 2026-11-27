import logo1x from '../assets/logo-48.webp'
import logo2x from '../assets/logo-96.webp'
import logo3x from '../assets/logo-144.webp'

/**
 * Logo do app (decorativa: o nome vem ao lado ou no `aria-label` do link). WebP quadrado em 1x/2x/3x, gerado de
 * docs/assets/logo_new.png: o navegador baixa só a do tamanho da tela (3, 10 e 18 KiB). As antigas ficam como
 * logo-*_legacy.webp.
 */
export function Logo({ className = '' }: { className?: string }) {
  return <img src={logo2x} srcSet={`${logo1x} 1x, ${logo2x} 2x, ${logo3x} 3x`} alt="" width={48} height={48} className={className} />
}
