/** Домен служебных адресов: у студентов нет «настоящей» почты, а Directus логинит только по email. */
export const LOGIN_DOMAIN = 'lms.protocol-lms.ru'

/** Допустимый студенческий/табельный номер (он же логин): латиница, цифры, . _ - */
export const STUDENT_ID_RE = /^[A-Za-z0-9._-]{3,32}$/

/** Что ввёл пользователь → email для Directus. Почта проходит как есть, номер превращается в служебный адрес. */
export function identityToEmail(identity: string): string {
  const v = identity.trim().toLowerCase()
  return v.includes('@') ? v : `${v}@${LOGIN_DOMAIN}`
}

/** Email нового пользователя: введённый вручную либо служебный из номера. */
export function emailForNewUser(email: string, studentId: string): string {
  return email.trim() ? email.trim().toLowerCase() : identityToEmail(studentId)
}
