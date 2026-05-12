-- =============================================================================
-- Artists: 1-op-1 koppeling profile_id <-> artist + cleanup van test-rommel
-- =============================================================================

-- 1. Partial UNIQUE index op profile_id (alleen waar niet-null).
--    Garandeert dat 1 user maar aan 1 artiest gekoppeld kan zijn.
create unique index if not exists artists_profile_id_unique
  on artists (profile_id)
  where profile_id is not null;

-- 2. Cleanup: profielen die per ongeluk aan >1 artiest hingen.
--    Behoud de meest recent gekoppelde (op id-volgorde), ontkoppel de rest.
with ranked as (
  select id, profile_id,
    row_number() over (partition by profile_id order by created_at desc, id desc) as rn
  from artists
  where profile_id is not null
)
update artists
set profile_id = null
where id in (select id from ranked where rn > 1);

-- 3. Verwijder lege test-rijen: geen profile, geen bookings, geen bio,
--    en stage_name lijkt nergens op iets serieus (eronder=arbitraire heuristiek
--    voor admins die nog 'echte' artiesten erin willen houden).
delete from artists a
where a.profile_id is null
  and a.bio is null
  and not exists (select 1 from bookings b where b.artist_id = a.id)
  and (
    lower(a.stage_name) ~ '^(test|aaa+|asdf+|qwerty|xxx+|tmp|temp)'
    or length(trim(a.stage_name)) < 2
  );
