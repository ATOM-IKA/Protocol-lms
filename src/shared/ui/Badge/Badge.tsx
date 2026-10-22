import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface-2',
        'px-3 py-1 font-mono text-xs uppercase tracking-widest text-ink-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
