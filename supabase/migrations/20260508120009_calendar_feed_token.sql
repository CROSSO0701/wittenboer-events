alter table public.profiles
  add column if not exists calendar_feed_token text unique;

create or replace function public.ensure_calendar_feed_token()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_token text;
begin
  select calendar_feed_token into current_token
  from profiles where id = auth.uid();
  if current_token is null then
    update profiles
    set calendar_feed_token = encode(gen_random_bytes(24), 'hex')
    where id = auth.uid()
    returning calendar_feed_token into current_token;
  end if;
  return current_token;
end;
$$;

grant execute on function public.ensure_calendar_feed_token() to authenticated;
