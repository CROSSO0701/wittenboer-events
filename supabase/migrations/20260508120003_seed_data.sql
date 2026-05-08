-- Wittenboer Events — seed data
-- 4 disco-pakketten + 8 artiesten. Profielen worden later gekoppeld door admin.

insert into disco_packages (slug, name, tagline, description, price_from_cents, guest_capacity_min, guest_capacity_max, hero_image_url, features, display_order, is_popular)
values
  (
    'compact',
    'Compact',
    'Instap-pakket',
    'Voor verjaardagen en kleinere zalen tot ±80 gasten. DJ-meubel met LED-parren, een 4-bar lichtbar en een Pioneer-set.',
    49500,
    20, 80,
    null,
    '["1× DJ-meubel truss met LED parren","1× 4-bar lichtbar","1× Pioneer-set (CDJ + mixer)"]'::jsonb,
    1,
    false
  ),
  (
    'booth',
    'Booth',
    'Compleet pakket',
    'Strak DJ-booth met d&b geluid. Tot ±150 gasten. Twee lichtbars en een set d&b audio.',
    59500,
    50, 150,
    null,
    '["2× 4-bar lichtbar","1× DJ-booth met 4 LED parren","1× Pioneer-set (CDJ + mixer)","1× booth-monitor","1× set d&b audio"]'::jsonb,
    2,
    false
  ),
  (
    'truss-show',
    'Truss Show',
    'Populairste',
    'De full-show. Truss-palen met moving heads en LED-parren, complete DJ-set en monitor. Tot ±250 gasten.',
    69500,
    100, 250,
    '/photos/park-lounge-2.jpg',
    '["4× truss-paal met LED par + moving head","1× truss-booth met LED parren","1× DJ-set (CDJ + mixer)","1× monitor","1× Pioneer-set"]'::jsonb,
    3,
    true
  ),
  (
    'show-wit',
    'Show Wit',
    'Premium · wit',
    'Bruiloften en chique gala-avonden. Witte uitstraling met witte truss-palen, moving heads en witte DJ-booth.',
    79500,
    100, 300,
    null,
    '["4× truss-paal met witte slave","4× moving head","4× LED par","1× DJ-booth wit","1× set d&b audio","1× Pioneer-set","1× booth-monitor"]'::jsonb,
    4,
    false
  )
on conflict (slug) do nothing;

insert into artists (slug, stage_name, genre, display_order, photo_url, external_booking_url, bio, active)
values
  ('jan-biggel',         'Jan Biggel',          'Nederlandstalig', 1, '/photos/artist-jan-biggel.jpg',     'https://www.janbiggel.nl',                                            'Bekend door zijn unieke geluid en enthousiaste optredens. 2020-hits "Fleske d''rin Fleske d''r" en "Ons Moeder Zeej Nog".', true),
  ('ferry-de-lits',      'Ferry de Lits',       'Nederlandstalig', 2, '/photos/artist-ferry-de-lits.jpg', 'https://www.ferrydelits.nl',                                          'Meerdere chart-hits, samenwerkingen met Django Wagner. Debuutalbum "Ritme Van De Nacht".', true),
  ('lars-brans',         'Lars Brans',          'Nederlandstalig', 3, '/photos/artist-mo-de-show.jpg',    'https://www.deaprodukties.nl/boeken/lars-brans/',                     'Sinds 2020 actief, met radio-hits als "Wil Je Met Me Dansen" en "Mijn Schat".', true),
  ('evert-van-huijgevoort','Evert van Huijgevoort','Nederlandstalig', 4, '/photos/artist-evert.jpg',     'https://www.casperjanssenmusicpromotion.nl/artiesten/evert-van-huygevoort/', 'Een van de meest veelbelovende zangers in Nederland. Samenwerking op "Al Mijn Maten" met Wesley Klein en Roy Donders.', true),
  ('jeffrey-lake',       'Jeffrey Lake',        'Nederlandstalig', 5, '/photos/artist-jeffrey.jpg',       'https://www.jeffreylake.nl',                                          'Werkt met Rood-Hit-Blauw, optredens naast Django Wagner en Wesley Klein. Single "With Christmas".', true),
  ('brian-more',         'Brian More',          'Nederlandstalig', 6, '/photos/artist-brian-more.jpg',    'https://www.brianmore.nl',                                            'Energieke performer. Engels en Nederlands, van ballades tot dance. "In De Nacht", "Schuil dan maar bij mij".', true),
  ('mo-de-show',         'Mo de Show',          'Nederlandstalig', 7, '/photos/artist-mo-de-show.jpg',    'https://www.rjbookings.nl/artiesten/zangers/zanger-mo-de-show/',      'Veelzijdig entertainer met Nederlandse volksmuziek-stijl.', true),
  ('dirk-drost',         'Dirk Drost',          'Nederlandstalig', 8, '/photos/artist-jeffrey.jpg',       'https://www.dirkdrost.nl',                                            'Debuut "Ik Hou Van Jou" (2015), getekend bij Limbo-Power. Bekend van "Oranje Kampioen".', true)
on conflict (slug) do nothing;
