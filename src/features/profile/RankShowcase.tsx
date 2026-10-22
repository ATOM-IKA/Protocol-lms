import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { GenerativeAvatar } from './GenerativeAvatar'
import { RANKS, RANK_STYLES, type Rank } from '@/entities/profile/ranks'
import { staggerContainer, fadeInUp } from '@/shared/lib/motion'
import { cn } from '@/shared/lib/cn'

/** Витрина: аватар на каждый ранг F→SSS. `current` подсвечивается рамкой. */
export function RankShowcase({ seed = 'PROTOCOL', current }: { seed?: string; current?: Rank }) {
  const { t } = useTranslation()
  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="grid grid-cols-3 gap-px border border-line bg-line sm:grid-cols-5 lg:grid-cols-9"
    >
      {RANKS.map((rank) => {
        const isCurrent = rank === current
        return (
          <motion.li
            key={rank}
            variants={fadeInUp}
            className={cn(
              'relative flex flex-col items-center gap-2 bg-surface p-4 transition-colors',
              isCurrent && 'z-10 bg-surface-2 ring-2 ring-inset ring-aqua',
            )}
          >
            {isCurrent && (
              <span className="absolute right-2 top-2 font-mono text-[8px] uppercase tracking-widest text-aqua">
                {t('profile.you')}
              </span>
            )}
            <GenerativeAvatar seed={seed} rank={rank} size={72} />
            <span className={cn('font-display text-lg font-bold', isCurrent ? 'text-aqua' : 'text-ink')}>{rank}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{RANK_STYLES[rank].motto}</span>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}
