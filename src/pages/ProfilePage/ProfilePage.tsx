import { Header } from '@/widgets/Header'
import { Container } from '@/shared/ui/Container'
import { Label } from '@/shared/ui/Label'
import { ProfileIdCard } from '@/features/profile/ProfileIdCard'
import { RankShowcase } from '@/features/profile/RankShowcase'
import type { ProfileCard } from '@/entities/profile/types'

const DEMO: ProfileCard = {
  id: '0xA1-2024-1043',
  callsign: 'NULL_RIDER',
  fullName: 'Алексей Морозов',
  institutionShort: 'КИТ',
  institutionName: 'Колледж ИТ',
  role: 'student',
  level: 12,
  xp: 2340,
  xpForNext: 3200,
  rank: 'A',
  hours: 780,
}

export function ProfilePage() {
  return (
    <>
      <Header />
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(#11141d 1px, transparent 1px), linear-gradient(90deg, #11141d 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <Container>
          <div className="py-16">
            <div className="flex items-center justify-between">
              <Label accent>// цифровой профиль</Label>
              <Label>id-карта</Label>
            </div>
            <h1 className="mt-3 text-5xl">
              Профиль<span className="text-aqua">.</span>
            </h1>
            <p className="mt-3 max-w-lg text-ink-soft">
              Уникальная цифровая ID-карта: генеративный аватар, уровень, опыт и ранг.
              Аватар можно заменить на своё фото в настройках.
            </p>

            <div className="mt-10 max-w-md">
              <ProfileIdCard card={DEMO} />
            </div>

            <div className="mt-20">
              <div className="flex items-center justify-between">
                <Label accent>// ранги</Label>
                <Label>F → SSS</Label>
              </div>
              <h2 className="mt-3 text-3xl">
                Каждый ранг — выше<span className="text-aqua">.</span>
              </h2>
              <p className="mt-2 max-w-lg text-ink-soft">
                От F до SSS аватар получает новые цвета, свечение, рамку, вращающиеся кольца и частицы.
              </p>
              <div className="mt-8">
                <RankShowcase seed={DEMO.callsign} />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
