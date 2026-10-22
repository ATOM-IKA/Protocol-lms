import { useTranslation } from 'react-i18next'
import { Container } from '@/shared/ui/Container'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="border-t border-line bg-surface">
      <Container className="flex flex-col items-center justify-between gap-3 py-8 sm:flex-row">
        <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">
          © {new Date().getFullYear()} PROTOCOL
        </span>
        <span className="text-sm text-ink-muted">{t('landing.footer_tagline')}</span>
      </Container>
    </footer>
  )
}
