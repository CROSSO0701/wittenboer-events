export type Artist = {
  slug: string
  name: string
  blurb: string
  bookingUrl: string
  photo?: string
}

export const artists: Artist[] = [
  {
    slug: 'jan-biggel',
    name: 'Jan Biggel',
    blurb: 'Bekend door zijn unieke geluid en enthousiaste optredens. 2020-hits "Fleske d\'rin Fleske d\'r" en "Ons Moeder Zeej Nog".',
    bookingUrl: 'https://www.janbiggel.nl',
    photo: '/photos/artist-jan-biggel.jpg',
  },
  {
    slug: 'ferry-de-lits',
    name: 'Ferry de Lits',
    blurb: 'Meerdere chart-hits, samenwerkingen met Django Wagner. Debuutalbum "Ritme Van De Nacht".',
    bookingUrl: 'https://www.ferrydelits.nl',
    photo: '/photos/artist-ferry-de-lits.jpg',
  },
  {
    slug: 'lars-brans',
    name: 'Lars Brans',
    blurb: 'Sinds 2020 actief, met radio-hits als "Wil Je Met Me Dansen" en "Mijn Schat".',
    bookingUrl: 'https://www.deaprodukties.nl/boeken/lars-brans/',
    photo: '/photos/artist-mo-de-show.jpg',
  },
  {
    slug: 'evert-van-huigevoort',
    name: 'Evert van Huigevoort',
    blurb: 'Een van de meest veelbelovende zangers in Nederland. Samenwerking op "Al Mijn Maten" met Wesley Klein en Roy Donders.',
    bookingUrl: 'https://www.casperjanssenmusicpromotion.nl/artiesten/evert-van-huygevoort/',
    photo: '/photos/artist-evert.jpg',
  },
  {
    slug: 'jeffrey-lake',
    name: 'Jeffrey Lake',
    blurb: 'Werkt met Rood-Hit-Blauw, optredens naast Django Wagner en Wesley Klein. Single "With Christmas".',
    bookingUrl: 'https://www.jeffreylake.nl',
    photo: '/photos/artist-jeffrey.jpg',
  },
  {
    slug: 'brian-more',
    name: 'Brian More',
    blurb: 'Energieke performer. Engels en Nederlands, van ballades tot dance. "In De Nacht", "Schuil dan maar bij mij".',
    bookingUrl: 'https://www.brianmore.nl',
    photo: '/photos/artist-brian-more.jpg',
  },
  {
    slug: 'mo-de-show',
    name: 'Mo de Show',
    blurb: 'Veelzijdig entertainer met Nederlandse volksmuziek-stijl. Optredens vanaf de jeugd.',
    bookingUrl: 'https://www.rjbookings.nl/artiesten/zangers/zanger-mo-de-show/',
    photo: '/photos/artist-mo-de-show.jpg',
  },
  {
    slug: 'dirk-drost',
    name: 'Dirk Drost',
    blurb: 'Debuut "Ik Hou Van Jou" (2015), getekend bij Limbo-Power. Bekend van "Oranje Kampioen".',
    bookingUrl: 'https://www.dirkdrost.nl',
    photo: '/photos/artist-jeffrey.jpg',
  },
]
