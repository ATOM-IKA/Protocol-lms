import { Outlet } from 'react-router-dom'
import { AppTopbar } from './AppTopbar'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar />
      {/* строка колонок тянется на всю высоту под топбаром */}
      <div className="flex flex-1 min-h-[calc(100dvh-4rem)]">
        <Sidebar />
        <main className="relative min-w-0 flex-1 pb-24 lg:pb-0">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(#11141d 1px, transparent 1px), linear-gradient(90deg, #11141d 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
