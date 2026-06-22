# Supabase - Wittenboer Events

De backend draait op Supabase (Postgres + Auth + SSR-cookies). Het schema, de RLS,
de seed en alle losse uitbreidingen staan als versiebeheerde migraties in
`supabase/migrations/`. Dit document beschrijft wat elke migratie doet, hoe je ze
naar productie pusht, hoe de integratie-credentials worden opgeslagen en hoe je de
eerste admin promoveert.

Hands-off: de map `supabase/` is backend-blueprint. Alleen aanpassen na overleg;
type-regen en bugfixes uitgezonderd.

## Migraties

Volgorde is de timestamp-prefix. Push past ze in volgorde toe.

| Bestand | Groep | Wat het doet |
|---|---|---|
| `20260508120001_initial_schema.sql` | Schema | Extensies (`uuid-ossp`, `pgcrypto`), enums (`user_role`, `booking_source`, `booking_status`, `inquiry_status`, `notification_channel`), kerntabellen: `profiles`, `artists`, `bookings`, `booking_assignments`, `disco_packages`, `disco_inquiries`, `contact_inquiries`, `artist_booking_inquiries`, plus helpers (`is_admin()`, `current_artist_id()`, `touch_updated_at()`). |
| `20260508120002_rls_policies.sql` | RLS | Zet row-level security aan op alle tabellen en definieert de policies (eigen-rij + admin-override op `profiles`; rolgebonden lees/schrijf op bookings, artists, inquiries enz.). |
| `20260508120003_seed_data.sql` | Seed | De eerste 4 show-pakketten (`compact`, `booth`, en de overige twee) + 8 vaste artiesten. Profielen worden later door de admin gekoppeld. |
| `20260508120004_auth_profile_trigger.sql` | Auth-trigger | `handle_new_user()` (security definer) + trigger `on_auth_user_created`: maakt automatisch een `profiles`-rij (rol `staff`) bij elke nieuwe `auth.users`. |
| `20260508120005_profile_has_password.sql` | Schema | Voegt `profiles.has_password` toe; gezet door `/api/portal/account/password` na een geslaagde wachtwoord-update. |
| `20260508120006_integration_credentials.sql` | Integration credentials | Tabel `integration_credentials` (per provider: refresh_token, access_token, expires_at, extra jsonb). RLS: alleen admin. Vervangt env-vars voor koppelingen. |
| `20260508120007_audit_log.sql` | Audit log | Append-only `audit_log` (actor, action, entity, metadata, timestamp) + recent-index. RLS: admin leest en schrijft. |
| `20260508120008_dashboard_stats.sql` | Dashboard stats | `dashboard_stats()` (security definer): één call die open/deze-week/vorige-week/weekend/staff-planned telt, in plaats van meerdere PostgREST HEAD-counts. |
| `20260508120009_calendar_feed_token.sql` | Calendar feed token | Voegt `profiles.calendar_feed_token` toe + `ensure_calendar_feed_token()` voor een persoonlijke iCal-feed-URL. |
| `20260508120010_clients.sql` | Clients | Tabel `clients` (contact + boeking-aggregaten) + `bookings.client_id` FK. RLS: admin. |
| `20260508120011_booking_notes.sql` | Booking notes | Tabel `booking_notes` per boeking. RLS: admin volledig; artiest leest notities op eigen boekingen. |
| `20260512200000_artists_uniqueness_and_cleanup.sql` | Artists cleanup | Partial unique index op `artists.profile_id` (1 user = 1 artiest) + opschoning van dubbel-gekoppelde en lege test-rijen. |
| `20260601214242_klussen_availability.sql` | Klussen / availability | Logistieke klussen (opbouw/afbreken/ophalen) met crew-toewijzingen + vrij/vakantie-perioden per crewlid. Enums `klus_kind`, `availability_kind`. |
| `20260601230450_klus_types.sql` | Klus-types | Beheerbare `klus_types`-lijst (admin) die de vaste `klus_kind`-enum vervangt; enum blijft staan zodat oudere migraties niet breken. |
| `20260622090000_black_and_gold_package.sql` | Black & Gold pakket | Vult het 5e show-pakket (`show-goud`, "Black & Gold") aan dat het frontend al toont. Idempotent: `on conflict (slug) do nothing`. |

## Naar productie pushen

Vereist de Supabase CLI (via `pnpm dlx supabase ...`) en een access token. Zet de
token in je shell-omgeving, hardcode hem nooit in een bestand en commit hem niet.

```bash
# 1. Access token uit je shell-omgeving (nooit hardcoden, nooit committen)
export SUPABASE_ACCESS_TOKEN="<token-uit-je-eigen-omgeving>"

# 2. Project linken (project-ref staat in het Supabase-dashboard)
pnpm dlx supabase link --project-ref <project-ref>

# 3. Migraties pushen (past alle nog niet toegepaste migraties in volgorde toe)
pnpm dlx supabase db push
```

Daarna types regenereren en in `app/lib/db/{client,server}.ts` de `<Database>`-generic
weer aanzetten:

```bash
pnpm dlx supabase gen types typescript --project-id <project-ref> > app/lib/db/types.generated.ts
```

## Integratie-credentials (geen env-vars)

De live-koppelingen draaien op rijen in de `integration_credentials`-tabel, niet op
env-vars. Marnix beheert ze via de admin-pagina **`/portal/admin/integraties`**:

- **Google Calendar** - de refresh-token wordt opgehaald via de OAuth-consent op de
  integraties-pagina (`/api/oauth/google/start` -> `/api/oauth/google/callback`) en
  opgeslagen onder provider `google` (`refresh_token`/`access_token`/`expires_at`).
- **ArtwinLive** - de iCal-URL wordt op de integraties-pagina ingevoerd en in `extra`
  (jsonb) bewaard. De cron `/api/cron/artwinlive-sync` (Vercel, `0 6 * * *`) leest hem.
- **CallMeBot** - de WhatsApp-sleutel/instelling wordt op dezelfde pagina ingevoerd en
  in de tabel bewaard.

Plaats nooit een echte token, sleutel of URL met secret in dit bestand of in code.
Alles loopt via de admin-UI en de `integration_credentials`-tabel (RLS: alleen admin).

## Eerste admin promoveren

Nieuwe gebruikers krijgen via de trigger automatisch rol `staff`. Promoveer de eerste
admin eenmalig handmatig in de Supabase SQL editor, nadat de gebruiker is ingelogd:

```sql
update public.profiles
set role = 'admin'
where email = 'marnix@<vul-het-juiste-adres-in>';
```

Daarna kan deze admin de overige rollen en koppelingen via het portal beheren.
