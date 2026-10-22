import type { NavigateFunction } from 'react-router-dom'
import type { i18n as I18nType } from 'i18next'
import type { Role } from '@/features/auth/authStore'

export interface Command {
  id: string
  title: string
  hint?: string
  group: string
  keywords?: string
  run: () => void
}

interface Ctx {
  navigate: NavigateFunction
  i18n: I18nType
  authed: boolean
  role: Role | null
}

export function buildCommands({ navigate, i18n, authed, role }: Ctx): Command[] {
  const t = i18n.t.bind(i18n)
  const nav = t('cmd.group_nav')
  const lang = t('cmd.group_lang')
  const cmds: Command[] = []

  if (authed) {
    cmds.push(
      { id: 'go-dashboard', title: t('cmd.dashboard'), hint: '/app', group: nav, keywords: 'dashboard дашборд главная обзор', run: () => navigate('/app') },
      { id: 'go-courses', title: t('cmd.courses'), hint: '/app/courses', group: nav, keywords: 'courses курсы каталог', run: () => navigate('/app/courses') },
      { id: 'go-playground', title: t('cmd.playground'), hint: '/app/playground', group: nav, keywords: 'playground тренажёр конструктор дизайн', run: () => navigate('/app/playground') },
      { id: 'go-profile', title: t('cmd.profile'), hint: '/app/profile', group: nav, keywords: 'profile id профиль аватар', run: () => navigate('/app/profile') },
    )
    if (role === 'teacher' || role === 'admin' || role === 'superadmin') {
      cmds.push({ id: 'go-teach', title: t('cmd.teach'), hint: '/app/teach', group: nav, keywords: 'teach teacher препод курсы редактор', run: () => navigate('/app/teach') })
    }
    if (role === 'admin' || role === 'superadmin') {
      cmds.push({ id: 'go-admin', title: t('cmd.admin'), hint: '/app/admin', group: nav, keywords: 'admin админ панель', run: () => navigate('/app/admin') })
    }
  } else {
    cmds.push(
      { id: 'go-home', title: t('cmd.home'), hint: '/', group: nav, keywords: 'home landing лендинг главная', run: () => navigate('/') },
      { id: 'go-login', title: t('cmd.login'), hint: '/login', group: nav, keywords: 'login auth вход', run: () => navigate('/login') },
    )
  }

  cmds.push(
    { id: 'lang-ru', title: t('cmd.lang_ru'), group: lang, keywords: 'russian ru русский', run: () => void i18n.changeLanguage('ru') },
    { id: 'lang-en', title: t('cmd.lang_en'), group: lang, keywords: 'english en английский', run: () => void i18n.changeLanguage('en') },
  )
  return cmds
}
