create index if not exists contact_replies_author_user_idx on public.contact_replies(author_user_id) where author_user_id is not null;
create index if not exists lead_activity_actor_user_idx on public.lead_activity(actor_user_id) where actor_user_id is not null;
