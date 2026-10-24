import { describe, expect, it } from 'vitest'
import { emailForNewUser, identityToEmail, LOGIN_DOMAIN, STUDENT_ID_RE } from './loginIdentity'
// @ts-expect-error — обычный .mjs без типов; нужен только для сверки константы
import { LOGIN_DOMAIN as SERVER_DOMAIN } from '../../../directus/model.mjs'

describe('вход по номеру или почте', () => {
  it('номер превращается в служебный адрес, регистр и пробелы не важны', () => {
    expect(identityToEmail('S1001')).toBe(`s1001@${LOGIN_DOMAIN}`)
    expect(identityToEmail('  Demo-Student ')).toBe(`demo-student@${LOGIN_DOMAIN}`)
  })

  it('почта проходит как есть (в нижнем регистре)', () => {
    expect(identityToEmail('Teacher@College.RU')).toBe('teacher@college.ru')
  })

  it('email нового пользователя: введённый или служебный', () => {
    expect(emailForNewUser('', 'S1001')).toBe(`s1001@${LOGIN_DOMAIN}`)
    expect(emailForNewUser('  A@b.ru ', 'S1001')).toBe('a@b.ru')
  })

  it('формат студенческого номера', () => {
    for (const ok of ['S1001', 'ab-12', 'a.b_c-9', 'demo-student'])
      expect(STUDENT_ID_RE.test(ok), ok).toBe(true)
    for (const bad of ['ab', 'with space', 'кириллица', 'a@b', 'x'.repeat(33), ''])
      expect(STUDENT_ID_RE.test(bad), bad).toBe(false)
  })

  it('домен совпадает с серверным (directus/model.mjs)', () => {
    expect(LOGIN_DOMAIN).toBe(SERVER_DOMAIN)
  })
})
