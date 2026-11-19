import { ArrowDownIcon, CalendarBlankIcon, type IconWeight } from '@phosphor-icons/react'

/**
 * Calendário com uma seta de download no canto (baixar o .ics). O Phosphor não tem esse ícone: é o
 * CalendarBlank com o ArrowDown em selo, com o fundo da superfície para destacar do calendário. Sem
 * `weight`, o calendário usa o do IconContext (Duotone no app); a seta é sempre bold.
 */
export function CalendarDownloadIcon({ className = '', weight }: { className?: string; weight?: IconWeight }) {
  return (
    <span aria-hidden="true" className={`relative inline-block shrink-0 ${className}`}>
      <CalendarBlankIcon className="size-full" weight={weight} />
      <span className="absolute -right-0.5 -bottom-0.5 inline-flex size-[55%] items-center justify-center rounded-full bg-surface">
        <ArrowDownIcon className="size-full" weight="bold" />
      </span>
    </span>
  )
}
