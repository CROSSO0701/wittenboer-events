export type Project = {
  slug: string
  title: string
  location: string
  year: string
  description: string
  scope: string[]
  partners?: string[]
  photo: string
  testimonial: {
    quote: string
    author: string
    role: string
  }
}

export const projects: Project[] = [
  {
    slug: 'park-lounge-schijndel',
    title: 'Park Lounge Festival',
    location: 'Schijndel',
    year: '2023',
    description:
      'Festival in een woonwijk. Een locatie met akoestische uitdagingen en gevoelige buren. Wij hebben gerichte microfoonarrays opgesteld, monitoringapparatuur in de buurt geplaatst en het geluid verantwoord beheerd. Op alle podia verzorgden we licht- en geluidstechniek. Resultaat: minimaal klachten uit de buurt, een show van hoog niveau.',
    scope: [
      'Geluid op alle podia',
      'Volledig lichtplan en uitvoering',
      'Stroomvoorziening festivalterrein',
      'Geluidsmetingen en buurtbewaking',
    ],
    partners: ['Coreworks Steigerbouw', 'Roxxi'],
    photo: '/photos/project-park-lounge.jpg',
    testimonial: {
      quote:
        'Ik ben zeer tevreden over de diensten van Wittenboer Events en de professionele hulp van Marnix bij het organiseren van ons festival. Hij nam het werk volledig uit mijn handen, van A tot Z. Zeker een aanrader voor toekomstige evenementen.',
      author: 'Thomas de Groot',
      role: 'Oprichter Park Lounge',
    },
  },
  {
    slug: 'megapark-schijndel',
    title: 'Megapark Schijndel',
    location: 'Schijndel',
    year: '2022',
    description:
      'Een thema-evenement in de sfeer van het Megapark op Mallorca. Wij bouwden aangepaste installaties waaronder een werkende fontein op het hoofdpodium en verlichte danskooien met gesynchroniseerde lichteffecten. Artiestenboeking en backstage-coördinatie werden volledig door ons verzorgd. Alle artiesten waren via Wittenboer Events geboekt.',
    scope: [
      'Volledige technische productie',
      'Artiestenboeking en -begeleiding',
      'Backstage-coördinatie',
      'Speciale installaties (fontein, danskooien)',
    ],
    photo: '/photos/project-megapark.jpg',
    testimonial: {
      quote:
        'Ik was onder de indruk van de professionele houding van het team, met name Marnix die de complete lichtshow verzorgde. Ze maakten het proces zo eenvoudig voor ons dat wij ons konden concentreren op het runnen van het evenement zelf.',
      author: 'Bert van Kronenburg',
      role: 'Eigenaar Beurs Schijndel',
    },
  },
]
