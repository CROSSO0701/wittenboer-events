export type Service = {
  slug: string
  title: string
  lead: string
  body: string
  bullets?: string[]
  image?: string
}

export const services: Service[] = [
  {
    slug: 'geluid',
    title: 'Geluid',
    lead: 'Goed geluid op een kantoorfeestje of een festival met 5000 bezoekers. Wij regelen beide.',
    body:
      'Wij verzorgen het complete audiosysteem. Van line-arrays en subs tot microfoontechniek en monitoring. Elk evenement krijgt een systeem dat bij de locatie past, met een geluidstechnicus die de show live mixt. Akoestisch uitdagende locaties? Wij rekenen het door en stellen een oplossing voor waarbij omgeving én publiek worden ontzien.',
    bullets: [
      'Line-arrays en point-source systemen (A-merk: L-Acoustics, d&b, RCF)',
      'Digitale mixers met multi-track opname',
      'In-ear monitoring en wedge-monitoring',
      'Meet- en richtmicrofoons voor klachtgevoelige locaties',
    ],
    image: '/photos/studio-023.jpg',
  },
  {
    slug: 'licht',
    title: 'Licht',
    lead: 'Een goede belichting bepaalt de hele sfeer van jouw evenement.',
    body:
      'Van een intiem bedrijfsdiner tot een compleet festivalpodium. Wij ontwerpen het lichtplan, bouwen het op en programmeren de show. Wij werken met A-merk fixtures, moving heads en architecturale armaturen. Een van onze technici staat altijd aan de console om de show live te operaten.',
    bullets: [
      'Volledig lichtontwerp op maat',
      'Moving heads, LED-wash, beams en architecturale verlichting',
      'Programmeerbare consoles (grandMA, Hog)',
      'Synchronisatie met video en geluid',
    ],
    image: '/photos/park-lounge-2.jpg',
  },
  {
    slug: 'tapeshows',
    title: 'Tapeshows',
    lead: 'Professionele tape-begeleiding voor artiesten. Wij kennen de repertoires van de meeste Nederlandse zangers.',
    body:
      'Wij draaien de tapes voor een groot aantal artiesten in Nederland. Bespreek met ons welke artiest je boekt, en wij zorgen dat hun show technisch soepel verloopt. Een tape-operator van ons staat naast de artiest op de bühne of in de techniek, afhankelijk van de wens.',
  },
  {
    slug: 'stroomvoorziening',
    title: 'Stroomvoorziening',
    lead: 'Tijdelijke stroomvoorziening voor festivals, beurzen en bedrijfsevenementen.',
    body:
      'Wij leveren aggregaten, verdeelkasten, kabels en aansluitingen op maat. Voor kleine tuinfeesten tot grote festivalterreinen. Een van onze technici maakt vooraf de belastingsberekening en zorgt dat het op de dag probleemloos draait. Inclusief redundante failover voor hoofdpodia.',
    bullets: [
      'Stille, EU-5 aggregaten (25kVA tot 500kVA)',
      'Complete verdeelkasten met CEE-aansluitingen',
      'Belastingsberekening en enkele/drie-fase verdeling',
      'Failover-opstellingen voor hoofdpodia',
    ],
  },
  {
    slug: 'artiestenbegeleiding',
    title: 'Artiestenbegeleiding',
    lead: 'Van aankomst tot laatste encore. Wij regelen de backstage.',
    body:
      'Een van de zaken die een evenement kan maken of breken is de artiestenbegeleiding. Wij zorgen voor tijdige aankomst, professionele backstage-faciliteiten, het programma en de aansluiting tussen artiest en techniek. Geen no-shows, geen chaos bij de wissels, alleen een strakke show.',
  },
  {
    slug: 'productiebegeleiding',
    title: 'Productiebegeleiding',
    lead: 'Van eerste gesprek tot en met de afbouw. End-to-end coördinatie.',
    body:
      'Wil je één aanspreekpunt voor je hele evenement? Wij nemen de volledige productie uit handen. Van locatie-inspectie, vergunningenadvies, leveranciersselectie, planning, techniek, artiesten en crewmanagement tot evaluatie. Jij hoeft alleen te genieten.',
  },
]

export const servicesBySlug = new Map(services.map((s) => [s.slug, s]))
