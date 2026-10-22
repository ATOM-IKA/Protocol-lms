import { AppProviders } from './providers/AppProviders'
import { AppRouter } from './AppRouter'

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
