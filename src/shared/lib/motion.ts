import type { Variants, Transition } from 'framer-motion'

/** Мягкое, «дорогое» замедление под ло-фай. */
export const EASE_LOFI = [0.22, 1, 0.36, 1] as const

export const transitionBase: Transition = {
  duration: 0.5,
  ease: EASE_LOFI,
}

/** Появление снизу с растворением. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitionBase },
}

/** Контейнер со стаггером дочерних элементов. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

/** Мягкое масштабирование при появлении (для карточек). */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transitionBase },
}
