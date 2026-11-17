import { Link } from 'react-router'
import { useI18n } from '../i18n/useI18n'
import { siteUrl, useDocumentHead } from '../seo/useDocumentHead'

export default function NotFound() {
  const { t } = useI18n()
  useDocumentHead({ title: t.seo.notFoundTitle, description: t.errors.notFound, canonical: siteUrl(), noindex: true })
  return (
    <section className="space-y-4 py-12 text-center">
      <h2 className="text-2xl font-semibold">404</h2>
      <p className="text-fg-muted">{t.errors.notFound}</p>
      <Link to="/" className="inline-flex min-h-11 items-center font-medium text-brand">
        {t.errors.backHome}
      </Link>
    </section>
  )
}
