/**
 * Модульная сборка: включение/выключение крупных блоков системы под нужды заказчика.
 * Отредактируйте флаги и пересоберите фронт (`npm run build`) — система «пересоберётся»
 * под конкретную компанию: полная СДО колледжа или облегчённая корпоративная LMS.
 */
export interface FeatureFlags {
  /** Библиотека тренажёров (UX/UI, консоль, сети, код). */
  trainers: boolean
  /** Геймификация: опыт, уровни, ранги, аватары рангов. */
  gamification: boolean
  /** Средний балл в профиле и на курсе. */
  averageGrade: boolean
  /** Мультиколледжность: выбор учебного заведения на входе. */
  institutions: boolean
  /** Меню спец-возможностей (доступность). */
  accessibilityMenu: boolean
  /** Портал — единая точка входа с продуктами. */
  portal: boolean
}

export const FEATURES: FeatureFlags = {
  trainers: true,
  gamification: true,
  averageGrade: true,
  institutions: true,
  accessibilityMenu: true,
  portal: true,
}
