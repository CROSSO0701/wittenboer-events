-- Track of een profile een wachtwoord heeft ingesteld.
-- Gezet door /api/portal/account/password na succesvolle updateUser({password}).

alter table public.profiles
  add column if not exists has_password boolean not null default false;

-- Geen index nodig — alleen geraadpleegd voor de huidige user.
