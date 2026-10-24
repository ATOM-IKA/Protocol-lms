import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { MarkLine, NoiseFilter } from '../parts'

/** Сцена 3: VISION — переливающаяся лента разрастается на весь экран и «рассыпается» в тьму. */
export function Vision() {
  const { t } = useTranslation()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const titleX = useTransform(p, [0, 0.25], ['-8%', '0%'])
  const textOpacity = useTransform(p, [0.36, 0.48], [1, 0])
  const expand = useTransform(p, [0.4, 0.86], [0, 1])
  const ribbonScale = useTransform(expand, [0, 1], [1, 36])
  const ribbonRotate = useTransform(expand, [0, 1], [24, 72])
  const noise = useTransform(expand, [0, 0.35, 1], [0, 30, 140])
  const dark = useTransform(p, [0.8, 0.97], [0, 1])

  return (
    <section id="pl-vision" ref={ref} className="relative h-[260vh] bg-ink text-bg">
      <NoiseFilter id="pl-noise-vision" strength={noise} />
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div
          aria-hidden
          style={{ x: titleX, opacity: textOpacity }}
          className="pl-outline absolute left-6 top-24 font-display text-[clamp(3rem,12vw,11rem)] font-black uppercase leading-none text-bg/60 sm:left-12"
        >
          VISION
        </motion.div>

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: 900 }}
        >
          <motion.div
            style={{ scale: ribbonScale, rotate: ribbonRotate, filter: 'url(#pl-noise-vision)' }}
            className="h-[52vh] w-[2.6vh] min-w-[12px]"
          >
            <motion.div
              className="pl-ribbon h-full w-full"
              animate={{ rotateY: [-55, 55, -55] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>

        <motion.div
          style={{ opacity: textOpacity }}
          className="absolute bottom-[14%] right-6 max-w-lg text-right sm:bottom-auto sm:right-12 sm:top-1/2 sm:-translate-y-1/2"
        >
          <h2 className="font-display text-[clamp(1.4rem,3.2vw,2.6rem)] font-bold leading-[1.3]">
            <MarkLine text={t('landing.vision_1')} i={0} className="ml-auto" />
            <MarkLine text={t('landing.vision_2')} i={1} className="ml-auto" />
          </h2>
          <p className="mt-6 font-mono text-xs text-bg/55">{t('landing.vision_sub')}</p>
        </motion.div>

        <motion.div aria-hidden style={{ opacity: dark }} className="absolute inset-0 bg-bg" />
      </div>
    </section>
  )
}
