create extension if not exists pgcrypto;

create type public.contact_status as enum ('new','in_progress','replied','closed','spam');
create type public.lead_status as enum ('new','qualified','contacted','converted','lost');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique default ('DVL-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (position('@' in email) > 1),
  organization text,
  phone text,
  service_interest text,
  preferred_contact_method text check (preferred_contact_method is null or preferred_contact_method in ('email','phone','whatsapp')),
  message text not null check (char_length(message) between 10 and 5000),
  consent boolean not null default false,
  status public.contact_status not null default 'new',
  source text not null default 'website',
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_replies (
  id uuid primary key default gen_random_uuid(),
  contact_message_id uuid not null references public.contact_messages(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  direction text not null check (direction in ('outbound','inbound')),
  channel text not null default 'email' check (channel in ('email','phone','whatsapp','internal')),
  subject text,
  body text not null check (char_length(body) between 1 and 10000),
  external_message_id text,
  delivery_status text check (delivery_status is null or delivery_status in ('queued','sent','delivered','failed','received')),
  created_at timestamptz not null default now()
);

create table public.website_leads (
  id uuid primary key default gen_random_uuid(),
  contact_message_id uuid unique references public.contact_messages(id) on delete set null,
  full_name text not null,
  email text not null,
  organization text,
  phone text,
  service_interest text,
  status public.lead_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (position('@' in email) > 1),
  full_name text,
  status text not null default 'active' check (status in ('active','unsubscribed','bounced')),
  source text not null default 'website',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table public.website_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create index contact_messages_status_idx on public.contact_messages(status);
create index contact_messages_created_at_idx on public.contact_messages(created_at desc);
create index contact_messages_email_idx on public.contact_messages(lower(email));
create index contact_replies_message_idx on public.contact_replies(contact_message_id, created_at);
create index website_leads_status_idx on public.website_leads(status);
create index website_leads_created_at_idx on public.website_leads(created_at desc);

create trigger set_contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();
create trigger set_website_leads_updated_at before update on public.website_leads for each row execute function public.set_updated_at();
create trigger set_website_settings_updated_at before update on public.website_settings for each row execute function public.set_updated_at();

alter table public.contact_messages enable row level security;
alter table public.contact_replies enable row level security;
alter table public.website_leads enable row level security;
alter table public.subscribers enable row level security;
alter table public.website_settings enable row level security;

create policy "public_can_read_public_settings" on public.website_settings for select to anon, authenticated using (is_public = true);

revoke all on public.contact_messages from anon, authenticated;
revoke all on public.contact_replies from anon, authenticated;
revoke all on public.website_leads from anon, authenticated;
revoke all on public.subscribers from anon, authenticated;

insert into public.website_settings (key, value, description, is_public)
values
  ('contact', jsonb_build_object('email','info@delightventures.com','location','Freetown, Sierra Leone'), 'Public contact information', true),
  ('messaging', jsonb_build_object('auto_acknowledgement',true,'lead_creation',true), 'Messaging feature flags', false)
on conflict (key) do nothing;
