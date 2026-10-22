import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { Label } from '@/shared/ui/Label'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Показать переключатель видимости для пароля. */
  reveal?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, reveal = false, type = 'text', className, id, ...props }, ref) => {
    const autoId = useId()
    const inputId = id ?? autoId
    const { t } = useTranslation()
    const [show, setShow] = useState(false)
    const effectiveType = reveal ? (show ? 'text' : 'password') : type

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId}>
            <Label>{label}</Label>
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            aria-invalid={!!error}
            className={cn(
              'h-12 w-full rounded-[10px] border bg-surface-2 px-4 text-ink',
              'placeholder:text-ink-dim transition-colors duration-200',
              'focus:border-lime focus:outline-none',
              error ? 'border-danger' : 'border-line-strong',
              reveal && 'pr-11',
              className,
            )}
            {...props}
          />
          {reveal && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? t('auth.hide_password') : t('auth.show_password')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-lime"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    )
  },
)
Input.displayName = 'Input'
