-- Delight Ventures website contact messaging schema
create extension if not exists pgcrypto;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  name text not null,
  email text not null,
  company text,
  phone text,
  service text not null default 'General Inquiry',
  preferred_contact text not null default 'Email',
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied','closed','spam')),
  source text not null default 'website',
  client_ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  replied_at timestamptz
);

create table if not exists public.contact_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.contact_messages(id) on delete cascade,
  sender_user_id uuid,
  recipient_email text not null,
  subject text not null,
  body text not null,
  email_provider_id text,
  sent_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_created_at on public.contact_messages(created_at desc);
create index if not exists idx_contact_messages_status on public.contact_messages(status);
create index if not exists idx_contact_replies_message on public.contact_replies(message_id, sent_at);

alter table public.contact_messages enable row level security;
alter table public.contact_replies enable row level security;

-- No anonymous table policies are intentionally created.
-- Public submissions go through the contact-message Edge Function using the service role.
-- Internal staff access/reply policies should be added when the Delight Hub auth roles are connected.
