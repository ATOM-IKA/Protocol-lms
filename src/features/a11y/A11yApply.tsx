import { useEffect } from 'react'
import { useA11y } from './a11yStore'

/** Применяет настройки доступности классами на <html>. Монтируется один раз в корне. */
export function A11yApply() {
  const { contrast, large, reduceMotion, grayscale } = useA11y()
  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('a11y-contrast', contrast)
    el.classList.toggle('a11y-large', large)
    el.classList.toggle('a11y-reduce-motion', reduceMotion)
    el.classList.toggle('a11y-grayscale', grayscale)
  }, [contrast, large, reduceMotion, grayscale])
  return null
}
