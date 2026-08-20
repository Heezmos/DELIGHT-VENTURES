create table if not exists public.contact_submission_limits (
  ip_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.contact_submission_limits enable row level security;
revoke all on public.contact_submission_limits from anon, authenticated;

create or replace function public.handle_new_contact_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.website_leads (
    contact_message_id,
    full_name,
    email,
    organization,
    phone,
    service_interest,
    status,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.full_name,
    new.email,
    new.organization,
    new.phone,
    new.service_interest,
    'new'::public.lead_status,
    now(),
    now()
  )
  on conflict (contact_message_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_contact_message() from public, anon, authenticated;

drop trigger if exists on_contact_message_created on public.contact_messages;
create trigger on_contact_message_created
after insert on public.contact_messages
for each row execute function public.handle_new_contact_message();

create or replace function public.consume_contact_rate_limit(p_ip_hash text, p_limit integer default 5, p_window_minutes integer default 15)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_row public.contact_submission_limits%rowtype;
begin
  if p_ip_hash is null or char_length(p_ip_hash) < 16 then
    return false;
  end if;

  select * into v_row
  from public.contact_submission_limits
  where ip_hash = p_ip_hash
  for update;

  if not found then
    insert into public.contact_submission_limits(ip_hash, window_started_at, request_count, updated_at)
    values (p_ip_hash, v_now, 1, v_now);
    return true;
  end if;

  if v_row.window_started_at <= v_now - make_interval(mins => p_window_minutes) then
    update public.contact_submission_limits
    set window_started_at = v_now, request_count = 1, updated_at = v_now
    where ip_hash = p_ip_hash;
    return true;
  end if;

  if v_row.request_count >= p_limit then
    return false;
  end if;

  update public.contact_submission_limits
  set request_count = request_count + 1, updated_at = v_now
  where ip_hash = p_ip_hash;

  return true;
end;
$$;

revoke execute on function public.consume_contact_rate_limit(text, integer, integer) from public, anon, authenticated;
