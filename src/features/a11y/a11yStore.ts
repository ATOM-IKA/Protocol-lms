import { create } from 'zustand'

const KEY = 'protocol-a11y'

export interface A11ySettings {
  contrast: boolean // высокий контраст
  large: boolean // крупный шрифт
  reduceMotion: boolean // меньше анимаций
  grayscale: boolean // ч/б (для дальтоников)
}

const DEFAULT: A11ySettings = { contrast: false, large: false, reduceMotion: false, grayscale: false }

function read(): A11ySettings {
  if (typeof localStorage === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<A11ySettings>) } : DEFAULT
  } catch {
    return DEFAULT
  }
}

interface A11yState extends A11ySettings {
  toggle: (key: keyof A11ySettings) => void
  reset: () => void
}

export const useA11y = create<A11yState>((set, get) => ({
  ...read(),
  toggle: (key) =>
    set(() => {
      const next = { ...get(), [key]: !get()[key] }
      const settings: A11ySettings = { contrast: next.contrast, large: next.large, reduceMotion: next.reduceMotion, grayscale: next.grayscale }
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(settings))
      return settings
    }),
  reset: () => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY)
    set(DEFAULT)
  },
}))
