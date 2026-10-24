import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn'
import { EASE_LOFI } from '@/shared/lib/motion'

interface Props {
  text: string
  /** false — буквы спрятаны (ждём конца интро); true — проявляются по очереди */
  play: boolean
  className?: string
}

/** Огромный вордмарк: буквы выезжают из-под маски с блюром, затем включается RGB-глитч. */
export function Wordmark({ text, play, className }: Props) {
  const [done, setDone] = useState(false)
  const letters = text.split('')
  return (
    <h1
      aria-label={text}
      data-text={text}
      data-on={done}
      className={cn(
        'pl-glitch relative font-display font-black uppercase leading-[1.1] tracking-tight',
        className,
      )}
    >
      <span aria-hidden className="flex">
        {letters.map((l, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em]">
            <motion.span
              className="inline-block"
              initial={{ y: '105%', opacity: 0, filter: 'blur(16px)' }}
              animate={play ? { y: 0, opacity: 1, filter: 'blur(0px)' } : undefined}
              transition={{ delay: i * 0.06, duration: 0.9, ease: EASE_LOFI }}
              onAnimationComplete={() => {
                if (play && i === letters.length - 1) setDone(true)
              }}
            >
              {l}
            </motion.span>
          </span>
        ))}
      </span>
    </h1>
  )
}
