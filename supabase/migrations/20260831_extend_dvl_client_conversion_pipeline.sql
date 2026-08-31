alter type public.lead_status add value if not exists 'consultation';
alter type public.lead_status add value if not exists 'quotation';
alter type public.lead_status add value if not exists 'approved';
alter type public.lead_status add value if not exists 'in_delivery';
alter type public.lead_status add value if not exists 'payment_pending';
alter type public.lead_status add value if not exists 'completed';
alter type public.lead_status add value if not exists 'follow_up';

alter table public.website_leads
  add column if not exists company_name text,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists quoted_amount numeric(14,2) check (quoted_amount is null or quoted_amount >= 0),
  add column if not exists currency text not null default 'SLE',
  add column if not exists quotation_reference text,
  add column if not exists approved_at timestamptz,
  add column if not exists delivery_started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists last_contacted_at timestamptz;

create index if not exists website_leads_follow_up_idx on public.website_leads(next_follow_up_at) where next_follow_up_at is not null;
create index if not exists website_leads_assigned_to_idx on public.website_leads(assigned_to) where assigned_to is not null;

create table if not exists public.lead_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.website_leads(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  activity_type text not null check (activity_type in ('status_change','note','consultation','quotation','approval','delivery','payment','follow_up','communication')),
  title text not null check (char_length(title) between 1 and 180),
  details text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lead_activity_lead_created_idx on public.lead_activity(lead_id, created_at desc);
alter table public.lead_activity enable row level security;
revoke all on public.lead_activity from anon, authenticated;

create or replace function public.log_website_lead_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.lead_activity(lead_id, activity_type, title, details, metadata)
    values (
      new.id,
      'status_change',
      'Lead status changed',
      old.status::text || ' → ' || new.status::text,
      jsonb_build_object('from', old.status::text, 'to', new.status::text)
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.log_website_lead_status_change() from public, anon, authenticated;
drop trigger if exists on_website_lead_status_changed on public.website_leads;
create trigger on_website_lead_status_changed
after update of status on public.website_leads
for each row execute function public.log_website_lead_status_change();