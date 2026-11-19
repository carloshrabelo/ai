import { CompassIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'
import { buttonClassName } from '../components/ui/buttonStyles'
import { useI18n } from '../i18n/useI18n'
import { siteUrl, useDocumentHead } from '../seo/useDocumentHead'

export default function NotFound() {
  const { t } = useI18n()
  useDocumentHead({ title: t.seo.notFoundTitle, description: t.errors.notFound, canonical: siteUrl(), noindex: true })
  return (
    <section className="flex flex-col items-center gap-4 py-12 text-center">
      <CompassIcon className="size-16 text-brand" aria-hidden="true" />
      <h2 className="text-2xl font-bold">{t.routes.notFound}</h2>
      <p className="max-w-sm text-fg-muted">{t.errors.notFoundHint}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClassName('primary')}>
          {t.errors.backHome}
        </Link>
        <Link to="/community" className={buttonClassName('secondary')}>
          {t.nav.community}
        </Link>
      </div>
    </section>
  )
}
