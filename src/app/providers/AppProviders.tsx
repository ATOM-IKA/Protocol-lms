import { useState, type ReactNode } from 'react'
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/shared/i18n/config'
import { ErrorBoundary } from './ErrorBoundary'
import { AuthInit } from '@/features/auth/AuthInit'
import { ConfirmProvider } from '@/shared/ui/Confirm'

import { ToastProvider, useToast } from '@/shared/ui/toast'

declare module '@tanstack/react-query' {
  interface Register {
    /** success — текст тоста после успешной мутации; без него успех молчит (автосохранение, отметки). */
    mutationMeta: { success?: string }
  }
}

/** QueryClient с глобальными тостами: ошибка любой мутации + успех по meta.success. */
function QueryProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
        },
        mutationCache: new MutationCache({
          onSuccess: (_d, _v, _c, mutation) => {
            const msg = mutation.meta?.success
            if (msg) toast.success(msg, 'готово')
          },
          onError: (e) => toast.error((e as Error).message || 'Не удалось выполнить действие', 'ошибка'),
        }),
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <ToastProvider>
          <QueryProvider>
            <AuthInit />
            <ConfirmProvider>{children}</ConfirmProvider>
          </QueryProvider>
        </ToastProvider>
      </I18nextProvider>
    </ErrorBoundary>
  )
}
