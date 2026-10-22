import { Header } from '@/widgets/Header'
import { Footer } from '@/widgets/Footer'
import { Hero } from './sections/Hero'
import { Features } from './sections/Features'
import { HowItWorks } from './sections/HowItWorks'
import { Stats } from './sections/Stats'
import { Cta } from './sections/Cta'

export function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Cta />
      </main>
      <Footer />
    </>
  )
}
