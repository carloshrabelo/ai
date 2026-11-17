import { defineConfig } from '@vite-pwa/assets-generator/config'

/**
 * Ícones do PWA a partir da logo quadrada (`pnpm generate-pwa-assets`).
 * O gerador grava os arquivos ao lado da imagem de origem (docs/assets/): mova
 * favicon.ico, pwa-*.png, maskable-icon-512x512.png e apple-touch-icon-180x180.png para public/.
 */
const background = '#10193b' // azul-marinho da logo, atrás do ícone maskable e do iOS

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    transparent: { sizes: [64, 192, 512], favicons: [[48, 'favicon.ico']], padding: 0 },
    maskable: { sizes: [512], padding: 0.3, resizeOptions: { background } },
    apple: { sizes: [180], padding: 0.1, resizeOptions: { background } },
  },
  images: ['docs/assets/logo_square.png'],
})
