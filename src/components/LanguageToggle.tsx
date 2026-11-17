import { setLocaleMode, useLocaleState } from '../i18n/locale'
import { useI18n } from '../i18n/useI18n'
import { Segmented } from './ui/Segmented'

/** Seletor de idioma: Automático (idioma do navegador) / Português / English. */
export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { mode } = useLocaleState()
  const { t } = useI18n()
  return (
    <Segmented
      label={t.info.language}
      value={mode}
      onChange={setLocaleMode}
      className={className}
      // O nome de cada idioma fica na própria língua.
      options={[
        { value: 'auto', label: t.info.languageAuto },
        { value: 'pt-BR', label: 'Português', lang: 'pt-BR' },
        { value: 'en-US', label: 'English', lang: 'en-US' },
      ]}
    />
  )
}
