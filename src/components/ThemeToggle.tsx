import { DesktopIcon, MoonIcon, SunIcon } from '@phosphor-icons/react'
import { useI18n } from '../i18n/useI18n'
import { useTheme } from '../theme/useTheme'
import { Segmented } from './ui/Segmented'

/** Seletor Claro / Escuro / Sistema. */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { mode, setMode } = useTheme()
  const { t } = useI18n()
  return (
    <Segmented
      label={t.info.theme}
      value={mode}
      onChange={setMode}
      className={className}
      options={[
        { value: 'light', label: t.info.themeLight, icon: <SunIcon className="size-5 shrink-0" aria-hidden="true" /> },
        { value: 'dark', label: t.info.themeDark, icon: <MoonIcon className="size-5 shrink-0" aria-hidden="true" /> },
        { value: 'system', label: t.info.themeSystem, icon: <DesktopIcon className="size-5 shrink-0" aria-hidden="true" /> },
      ]}
    />
  )
}
