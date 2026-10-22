import { Sparkles, Zap, Star, GraduationCap, Clock, FileCheck2, Coins, CalendarCheck, Crown, type LucideIcon } from 'lucide-react'
import type { Rank } from '@/entities/profile/ranks'

export interface AchStats {
  xp: number
  level: number
  hours: number
  coins: number
  avgGrade: number
  quizzesPassed: number
  attendancePct: number // -1 если нет данных
  rank: Rank
}

export interface Achievement {
  id: string
  icon: LucideIcon
  done: (s: AchStats) => boolean
}

const RANK_ORDER: Rank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'SSS+']
function rankAtLeast(r: Rank, min: Rank): boolean {
  return RANK_ORDER.indexOf(r) >= RANK_ORDER.indexOf(min)
}

/** Достижения. Названия/описания — в i18n (ach.<id>_title / ach.<id>_desc). */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_steps', icon: Sparkles, done: (s) => s.xp > 0 },
  { id: 'level5', icon: Zap, done: (s) => s.level >= 5 },
  { id: 'level10', icon: Star, done: (s) => s.level >= 10 },
  { id: 'scholar', icon: GraduationCap, done: (s) => s.avgGrade >= 4.5 },
  { id: 'marathon', icon: Clock, done: (s) => s.hours >= 50 },
  { id: 'quiz_master', icon: FileCheck2, done: (s) => s.quizzesPassed >= 5 },
  { id: 'rich', icon: Coins, done: (s) => s.coins >= 100 },
  { id: 'attendance', icon: CalendarCheck, done: (s) => s.attendancePct === 100 },
  { id: 'rank_a', icon: Crown, done: (s) => rankAtLeast(s.rank, 'A') },
]
