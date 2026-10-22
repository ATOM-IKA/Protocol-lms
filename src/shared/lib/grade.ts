/** Среднее по массиву оценок (0, если пусто). */
export function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

/**
 * Доля опыта за оценку: 5 — полностью, 4 — 70%, 3 — 50%, 2 и ниже — ничего.
 * XP за задание, который задаёт преподаватель, — это награда за «5».
 */
export function xpFactor(grade: number): number {
  if (grade >= 5) return 1
  if (grade >= 4) return 0.7
  if (grade >= 3) return 0.5
  return 0
}

/** Доля опыта с учётом пересдачи двойки: потолок как у «4» (0.7). */
export function xpFactorRetry(grade: number, retry: boolean): number {
  const f = xpFactor(grade)
  return retry ? Math.min(f, 0.7) : f
}

/** Опыт за урок: baseXp — награда за «5». Лекция (без сдачи) даёт полный baseXp. */
export function earnedXp(baseXp: number, opts: { submission: boolean; grade: number; retry: boolean }): number {
  if (!opts.submission) return baseXp
  return Math.round(baseXp * xpFactorRetry(opts.grade, opts.retry))
}

/** Цвет оценки (шкала 2–5), в тон палитре тренажёра. */
export function gradeTone(grade: number): string {
  if (grade >= 5) return 'border-lime text-lime'
  if (grade >= 4) return 'border-aqua text-aqua'
  if (grade >= 3) return 'border-warning text-warning'
  return 'border-danger text-danger'
}
