import type { Rank } from '@/entities/profile/ranks'

/** Порог XP для достижения уровня n (геометрический рост). */
export function xpForLevel(level: number): number {
  // уровень 1 начинается с 0 XP
  return Math.round(100 * Math.pow(Math.max(0, level - 1), 1.6))
}

export function levelFromXp(xp: number): { level: number; inLevel: number; forNext: number } {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return { level, inLevel: xp - base, forNext: next - base }
}

/** Ранг от уровня. */
export function rankFromLevel(level: number): Rank {
  if (level >= 40) return 'SSS'
  if (level >= 32) return 'SS'
  if (level >= 25) return 'S'
  if (level >= 19) return 'A'
  if (level >= 14) return 'B'
  if (level >= 10) return 'C'
  if (level >= 6) return 'D'
  if (level >= 3) return 'E'
  return 'F'
}

/** Ранг студента по накопленным часам обучения: F(0) → SSS(4000ч, «выпускник»). */
export function rankFromHours(hours: number): Rank {
  if (hours >= 4000) return 'SSS'
  if (hours >= 3000) return 'SS'
  if (hours >= 2000) return 'S'
  if (hours >= 1200) return 'A'
  if (hours >= 700) return 'B'
  if (hours >= 350) return 'C'
  if (hours >= 150) return 'D'
  if (hours >= 50) return 'E'
  return 'F'
}

/**
 * Ранг преподавателя растёт от числа студентов, прошедших ≥1 урок (+0.5 балла за каждого).
 * students — количество таких студентов.
 */
export function rankFromTeacherStudents(students: number): Rank {
  const p = students * 0.5
  if (p >= 120) return 'SSS'
  if (p >= 80) return 'SS'
  if (p >= 55) return 'S'
  if (p >= 35) return 'A'
  if (p >= 20) return 'B'
  if (p >= 10) return 'C'
  if (p >= 5) return 'D'
  if (p >= 2) return 'E'
  return 'F'
}
