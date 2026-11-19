/** Bloco cinza pulsante. Monte os skeletons com as mesmas dimensões do conteúdo real. */
export function Skeleton({ className = '', rounded = 'rounded-lg' }: { className?: string; rounded?: string }) {
  return <div aria-hidden="true" className={`animate-pulse bg-genre-neutral ${rounded} ${className}`} />
}
