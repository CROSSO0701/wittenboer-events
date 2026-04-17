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
        <section className="pt-24 md:pt-32 pb-8">
          <div className="container-inset">
            <div className="max-w-3xl">
              <p className="mono mb-3" style={{ color: 'var(--color-fg-muted)' }}>
                Projecten
              </p>
              <h1 className="max-w-[18ch] mb-6">Twee projecten, concrete resultaten.</h1>
              <p
                className="text-[var(--text-lg)]"
                style={{ color: 'var(--color-fg-secondary)', maxInlineSize: 'var(--measure-lead)' }}
              >
                Elk project is een andere puzzel. Hier twee verhalen — hoe we ze aanvlogen, wat
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
