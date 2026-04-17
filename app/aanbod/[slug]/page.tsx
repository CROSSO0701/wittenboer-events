import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Nav } from '../../components/layout/Nav'
import { Footer } from '../../components/layout/Footer'
import { ServiceDetail } from '../../components/services/ServiceDetail'
import { ContactCTA } from '../../components/home/ContactCTA'
import { services } from '../../lib/content/services'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return services.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const service = services.find((s) => s.slug === slug)
  if (!service) return { title: 'Dienst niet gevonden' }
  return {
    title: service.title,
    description: service.lead,
  }
}

export default async function ServicePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const service = services.find((s) => s.slug === slug)
  if (!service) notFound()

  return (
    <>
      <Nav />
      <main>
        <ServiceDetail service={service} />
        <ContactCTA />
      </main>
      <Footer />
    </>
  )
}
