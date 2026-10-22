/** Академический год (начинается 1 сентября). Июль 2026 → 2025, сентябрь 2026 → 2026. */
export function academicYear(d: Date = new Date()): number {
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1
}

/**
 * Код группы: курс (сколько лет учатся) + номер группы + специальность.
 * Пример: специальность «ИСиП-ИИ», год поступления 2025, номер 1 →
 *   2025-26 уч. год: «11-ИСиП-ИИ», 2026-27: «21-ИСиП-ИИ» (авто-смена 1 сентября).
 */
export function groupCode(specialty: string, startYear: number, index: number): string {
  const course = Math.max(1, academicYear() - startYear + 1)
  return `${course}${index || 1}-${specialty}`
}
