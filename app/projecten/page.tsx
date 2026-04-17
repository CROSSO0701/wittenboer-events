import type { Metadata } from 'next'
import { Nav } from '../components/layout/Nav'
import { Footer } from '../components/layout/Footer'
import { ProjectStory } from '../components/projects/ProjectStory'
import { ContactCTA } from '../components/home/ContactCTA'
import { projects } from '../lib/content/projects'

export const metadata: Metadata = {
  title: 'Projecten',
  description:
    'Uitgelicht werk van Wittenboer Events: Park Lounge Schijndel en Megapark Schijndel. Volledige productie, licht, geluid en artiestenbegeleiding.',
}

export default function ProjectenPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-32 md:pt-40 pb-12">
          <div className="container-inset">
            <div className="max-w-3xl">
              <p className="mb-3" style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
                Projecten
              </p>
              <h1
                className="max-w-[16ch] mb-6"
                style={{ fontSize: 'clamp(3rem, 2rem + 5vw, 7rem)', lineHeight: 0.92 }}
              >
                Werk waar we trots op zijn.
              </h1>
              <p
                className="text-[17px] md:text-[19px]"
                style={{ color: 'var(--color-fg-secondary)', maxInlineSize: '52ch', lineHeight: 1.55 }}
              >
                Elk project is een andere puzzel. Hier twee verhalen. Hoe we ze aanvlogen, wat
                we bouwden, en wat het publiek (en de buurt) ervan vond.
              </p>
            </div>
          </div>
        </section>

        {projects.map((p, i) => (
          <ProjectStory key={p.slug} project={p} reverse={i % 2 === 1} />
        ))}

        <ContactCTA />
      </main>
      <Footer />
    </>
  )
}
