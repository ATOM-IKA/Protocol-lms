import { cn } from '@/shared/lib/cn'

interface Props {
  checked: boolean
  onChange: () => void
  label?: string
}

export function ToggleSwitch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative h-6 w-11 rounded-full border transition-colors duration-200',
        checked ? 'border-lime bg-lime/20' : 'border-line-strong bg-surface-2',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-200',
          checked ? 'left-[calc(100%-1.25rem)] bg-lime' : 'left-1 bg-ink-muted',
        )}
      />
    </button>
  )
}
