-- Wittenboer Events — seed 5e showpakket
-- Het frontend (show-pakketten/page.tsx + brochure/data.ts) toont al "Black & Gold",
-- maar de oorspronkelijke seed (20260508120003) bevat alleen de eerste 4 pakketten.
-- Deze migratie vult het 5e pakket aan. Idempotent: on conflict (slug) do nothing.

insert into disco_packages (slug, name, tagline, description, price_from_cents, guest_capacity_min, guest_capacity_max, hero_image_url, features, display_order, is_popular)
values
  (
    'show-goud',
    'Black & Gold',
    'Premium · goud',
    'Bruiloften en chique feesten met een warme, gouden uitstraling: gouden DJ-meubel, Portman P1''s en wash moving heads.',
    79500,
    100, 250,
    null,
    '["1× DJ-meubel goud","2× Portman P1","2× wash moving head","1× monitor","1× A-set (geluid)","1× DJ-monitor"]'::jsonb,
    5,
    false
  )
on conflict (slug) do nothing;
