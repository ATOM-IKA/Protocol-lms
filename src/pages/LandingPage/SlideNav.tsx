import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { cn } from '@/shared/lib/cn'
import { goTo } from './parts'

export const SLIDES = [
  { id: 'pl-stage', label: 'top' },
  { id: 'pl-about', label: 'about' },
  { id: 'pl-vision', label: 'vision' },
  { id: 'pl-workflow', label: 'workflow' },
  { id: 'pl-spotlight', label: 'protocol' },
  { id: 'pl-finale', label: 'contact' },
] as const

/** Полоска прогресса сверху + рельс сцен слева (инвертируется на светлых сценах). */
export function SlideNav() {
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(SLIDES.findIndex((s) => s.id === e.target.id))
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    SLIDES.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  return (
    <>
      <motion.div
        aria-hidden
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-aqua to-lime"
      />
      <nav
        aria-label="Разделы"
        className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 text-white mix-blend-difference md:flex"
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(s.id)}
            aria-label={s.label}
            aria-current={i === active}
            className="group flex items-center gap-3"
          >
            <span
              className={cn(
                'block h-px bg-current transition-all duration-500',
                i === active ? 'w-8' : 'w-3 opacity-50 group-hover:w-5 group-hover:opacity-100',
              )}
            />
            <span
              className={cn(
                'font-mono text-[10px] uppercase tracking-widest transition-opacity',
                i === active ? 'opacity-100' : 'opacity-0 group-hover:opacity-70',
              )}
            >
              {s.label}
            </span>
          </button>
        ))}
      </nav>
    </>
  )
}
