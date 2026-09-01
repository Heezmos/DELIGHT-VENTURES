create or replace function public.prepare_website_lead_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.company_name is null and new.organization is not null then
    new.company_name := new.organization;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'contacted'::public.lead_status and new.last_contacted_at is null then
      new.last_contacted_at := now();
    elsif new.status = 'approved'::public.lead_status and new.approved_at is null then
      new.approved_at := now();
    elsif new.status = 'in_delivery'::public.lead_status and new.delivery_started_at is null then
      new.delivery_started_at := now();
    elsif new.status = 'completed'::public.lead_status and new.completed_at is null then
      new.completed_at := now();
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.prepare_website_lead_lifecycle() from public, anon, authenticated;
drop trigger if exists prepare_website_lead_lifecycle on public.website_leads;
create trigger prepare_website_lead_lifecycle
before insert or update on public.website_leads
for each row execute function public.prepare_website_lead_lifecycle();
