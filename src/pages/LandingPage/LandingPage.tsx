import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import Lenis from 'lenis'
import { LandingHeader } from './LandingHeader'
import { SlideNav } from './SlideNav'
import { Intro } from './Intro'
import { Stage } from './sections/Stage'
import { About } from './sections/About'
import { Vision } from './sections/Vision'
import { Workflow } from './sections/Workflow'
import { Spotlight } from './sections/Spotlight'
import { Finale } from './sections/Finale'
import './landing.css'

const INTRO_KEY = 'pl-intro-seen'
const readSeen = (): boolean => {
  try {
    return localStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}
const writeSeen = (): void => {
  try {
    localStorage.setItem(INTRO_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function LandingPage() {
  const reduce = useReducedMotion()
  const lenisRef = useRef<Lenis | null>(null)
  // заставка сама играет только при первом входе; дальше — по кнопке «▶ intro»
  const [intro, setIntro] = useState(() => !readSeen())

  useEffect(() => {
    document.documentElement.classList.add('pl-root')
    return () => document.documentElement.classList.remove('pl-root')
  }, [])

  // плавный инерционный скролл (как у референса); при reduced-motion — нативный
  useEffect(() => {
    if (reduce) return
    const lenis = new Lenis({ lerp: 0.085 })
    lenisRef.current = lenis
    let raf = 0
    const loop = (time: number): void => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [reduce])

  // навигация по сценам (шапка, рельс, футер шлют событие pl:goto)
  useEffect(() => {
    const onGo = (e: Event): void => {
      const el = document.getElementById((e as CustomEvent<string>).detail)
      if (!el) return
      if (lenisRef.current) lenisRef.current.scrollTo(el, { duration: 1.6 })
      else el.scrollIntoView({ behavior: 'smooth' })
    }
    window.addEventListener('pl:goto', onGo)
    return () => window.removeEventListener('pl:goto', onGo)
  }, [])

  // пока идёт заставка — скролл заблокирован
  useEffect(() => {
    if (!intro) return
    if (reduce) {
      setIntro(false)
      return
    }
    writeSeen()
    window.scrollTo(0, 0)
    lenisRef.current?.stop()
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      lenisRef.current?.start()
    }
  }, [intro, reduce])

  const finishIntro = useCallback(() => setIntro(false), [])
  const replay = useCallback(() => {
    lenisRef.current?.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
    setIntro(true)
  }, [])

  return (
    <div className="pl">
      <LandingHeader />
      <SlideNav />
      {intro && <Intro onDone={finishIntro} />}
      <main>
        <Stage onReplay={replay} />
        <About />
        <Vision />
        <Workflow />
        <Spotlight />
      </main>
      <Finale onReplay={replay} />
    </div>
  )
}
