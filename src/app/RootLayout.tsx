import { Outlet } from 'react-router-dom'
import { CommandPalette } from '@/features/command-palette/CommandPalette'
import { A11yApply } from '@/features/a11y/A11yApply'

export function RootLayout() {
  return (
    <>
      <A11yApply />
      <CommandPalette />
      <Outlet />
    </>
  )
}
