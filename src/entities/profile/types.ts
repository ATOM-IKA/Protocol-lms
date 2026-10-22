import type { Rank } from './ranks'
import type { Role } from '@/features/auth/authStore'

export interface ProfileCard {
  id: string
  callsign: string
  fullName: string
  institutionShort: string
  institutionName: string
  role: Role
  level: number
  xp: number
  xpForNext: number
  rank: Rank
  /** Накопленные часы (студент) и число продвинутых студентов (преподаватель). */
  hours?: number
  teacherStudents?: number
  /** Внутренняя валюта (видна только владельцу). */
  coins?: number
  /** Код группы, напр. «11-ИСиП-ИИ». */
  groupCode?: string
  /** Явный процент прогресса к след. уровню (0..100); иначе xp/xpForNext. */
  progressPct?: number
  /** URL загруженного фото (если есть) — иначе генеративный аватар. */
  photoUrl?: string
  /** Средний балл по всем курсам (0 = нет оценок). */
  avgGrade?: number
}
