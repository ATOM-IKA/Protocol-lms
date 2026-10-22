import { Component, type ErrorInfo, type ReactNode } from 'react'
import i18n from '@/shared/i18n/config'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Заглушка под будущий Sentry (без PII)
    console.error('ErrorBoundary:', error.message, info.componentStack)
  }

  handleReset = (): void => {
    this.setState({ hasError: false })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <h1 className="text-2xl">{i18n.t('common.error')}</h1>
          <p className="text-ink-soft max-w-md">
            {i18n.t('common.error_text')}
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-[10px] bg-lime px-5 py-2.5 font-semibold text-bg transition-colors hover:bg-lime-bright"
          >
            {i18n.t('common.retry')}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
