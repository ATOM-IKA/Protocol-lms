import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/** Моно-метка в стиле «07 / QUIET LUXURY», «MISTAKE 02». */
export function Label({
  children,
  className,
  accent = false,
}: {
  children: ReactNode
  className?: string
  accent?: boolean
}) {
  return (
    <span className={cn('label-mono', accent && 'text-aqua', className)}>{children}</span>
  )
}
