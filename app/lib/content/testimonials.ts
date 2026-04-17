export type Testimonial = {
  quote: string
  author: string
  role: string
}

export const testimonials: Testimonial[] = [
  {
    quote:
      'Ik ben zeer tevreden over de diensten van Wittenboer Events en de professionele hulp van Marnix bij het organiseren van ons festival. Hij nam het werk volledig uit mijn handen — van A tot Z.',
    author: 'Thomas de Groot',
    role: 'Oprichter Park Lounge',
  },
  {
    quote:
      'Ik was onder de indruk van de professionele houding van het team. Ze maakten het proces zo eenvoudig voor ons dat wij ons konden concentreren op het runnen van het evenement zelf.',
    author: 'Bert van Kronenburg',
    role: 'Eigenaar Beurs Schijndel',
  },
  {
    quote:
      'Wittenboer Events en Marnix Wittenboer zijn voor ons de automatische keuze — van licht en geluid tot artiestenbegeleiding en logistiek. Altijd professioneel, altijd meedenkend. Wij worden volledig ontzorgd.',
    author: 'Berk Music',
    role: 'Platenlabel & management',
  },
]
