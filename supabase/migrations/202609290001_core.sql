-- PostgreSQL / Supabase. Run once through migrations; all private relations enforce ownership.
create type public.invoice_state as enum ('draft','issued','cancelled');
create type public.pension_scheme as enum ('separata','artigiani','commercianti','custom');
create type public.deadline_kind as enum ('official','estimated','personal');
create type public.tax_payment_kind as enum ('contribution','balance','first_advance','second_advance','other');

create table public.profiles (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
 first_name text not null default '' check(length(first_name)<=100), last_name text not null default '' check(length(last_name)<=100), business_name text not null default '' check(length(business_name)<=200),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.tax_configurations (
 id uuid primary key default gen_random_uuid(), tax_year integer not null check(tax_year between 2000 and 2100), version text not null,
 valid_from date not null, valid_to date not null, parameters jsonb not null check(jsonb_typeof(parameters)='object'),
 sources jsonb not null default '[]', verified_at date, notes text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tax_year,version), check(valid_to>=valid_from)
);
create table public.fiscal_profiles (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 tax_year integer not null check(tax_year between 2000 and 2100), vat_number text not null check(vat_number ~ '^[0-9]{11}$'), tax_code text not null check(tax_code ~ '^[A-Z0-9]{16}$'),
 ateco text not null check(ateco ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{2}$'), activity text not null check(length(activity) between 1 and 500), opened_year integer not null check(opened_year between 1900 and 2100),
 coefficient numeric(7,4) not null check(coefficient>0 and coefficient<=1), tax_rate numeric(7,4) not null check(tax_rate>=0 and tax_rate<=1),
 scheme public.pension_scheme not null, contribution_rate numeric(7,4) not null check(contribution_rate between 0 and 1), reduction numeric(7,4) not null default 0 check(reduction between 0 and 1),
 minimum_income numeric(14,2) not null default 0 check(minimum_income>=0), ceiling numeric(14,2) not null check(ceiling>0), extra_threshold numeric(14,2) not null default 0 check(extra_threshold>=0), extra_rate numeric(7,4) not null default 0 check(extra_rate between 0 and 1),
 fixed_fee numeric(14,2) not null default 0 check(fixed_fee>=0), active_months integer not null default 12 check(active_months between 1 and 12),
 threshold numeric(14,2) not null check(threshold>0), exit_threshold numeric(14,2) not null check(exit_threshold>=threshold), additional_advance numeric(14,2) not null default 0 check(additional_advance>=0),
 configuration_id uuid references public.tax_configurations(id), configuration_version text not null, eligibility_confirmed boolean not null default false,
 notes text not null default '' check(length(notes)<=4000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,tax_year), unique(id,user_id), check(opened_year<=tax_year), check(ceiling>=minimum_income)
);
create table public.clients (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 200), vat_number text not null default '', tax_code text not null default '', email text not null default '', pec text not null default '', recipient_code text not null default '',
 address text not null default '', postal_code text not null default '', city text not null default '', province text not null default '', country text not null default 'IT', notes text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id),
 check(length(vat_number)<=30 and length(tax_code)<=30 and length(email)<=254 and length(pec)<=254 and length(notes)<=4000)
);
create table public.invoices (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 client_id uuid not null, number text not null check(length(number) between 1 and 50), issue_date date not null, due_date date not null,
 state public.invoice_state not null default 'draft', description text not null default '' check(length(description)<=4000), total numeric(14,2) not null default 0 check(total>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id),
 foreign key(client_id,user_id) references public.clients(id,user_id), unique(user_id,number), check(due_date>=issue_date)
);
create table public.invoice_items (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, invoice_id uuid not null,
 description text not null check(length(description) between 1 and 500), quantity numeric(12,3) not null check(quantity>0 and quantity<=1000000), unit_price numeric(14,2) not null check(unit_price>=0 and unit_price<=100000000),
 position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(invoice_id,user_id) references public.invoices(id,user_id) on delete cascade
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, invoice_id uuid not null,
 amount numeric(14,2) not null check(amount>0), paid_on date not null check(paid_on<=current_date), method text not null check(method in ('bank','cash','card','other')), notes text not null default '' check(length(notes)<=4000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(invoice_id,user_id) references public.invoices(id,user_id) on delete cascade
);
create table public.tax_payments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 kind public.tax_payment_kind not null, amount numeric(14,2) not null check(amount>0), paid_on date not null check(paid_on<=current_date), tax_year integer not null check(tax_year between 2000 and 2100),
 deductible boolean not null default false, notes text not null default '' check(length(notes)<=4000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(not deductible or kind='contribution')
);
create table public.savings_reserves (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 amount numeric(14,2) not null check(amount<>0), reserved_on date not null check(reserved_on<=current_date), tax_year integer not null check(tax_year between 2000 and 2100), notes text not null default '' check(length(notes)<=4000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.deadlines (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 200), due_date date not null, amount numeric(14,2) not null default 0 check(amount>=0), kind public.deadline_kind not null,
 paid boolean not null default false, source_url text not null default '', verified_on date, notes text not null default '' check(length(notes)<=4000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(kind<>'official' or (source_url ~ '^https://' and verified_on is not null))
);
create table public.tax_estimates (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 tax_year integer not null, parameters jsonb not null, result jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.activity_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 entity text not null, entity_id uuid not null, action text not null, fiscal_snapshot jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin
 foreach t in array array['profiles','fiscal_profiles','clients','invoices','invoice_items','payments','tax_payments','savings_reserves','deadlines','tax_estimates','activity_logs'] loop
   execute format('alter table public.%I enable row level security',t);
   execute format('create policy owner_select on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
   if t not in ('activity_logs','tax_estimates') then
     execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
     execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
     execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid())=user_id)',t);
   end if;
   execute format('create index on public.%I(user_id)',t);
   execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()',t);
 end loop;
end $$;
alter table public.tax_configurations enable row level security;
create policy configuration_read on public.tax_configurations for select to authenticated using(true);
create trigger touch before update on public.tax_configurations for each row execute function public.touch_updated_at();
create index on public.invoices(user_id,issue_date desc);
create index on public.payments(user_id,paid_on);
create index on public.payments(invoice_id);
create index on public.invoice_items(invoice_id);
create index on public.deadlines(user_id,due_date);
create index on public.tax_payments(user_id,tax_year);

-- No free-form PII in audit; only fiscal parameter snapshots, never name/address/tax IDs.
create function public.audit_private_change() returns trigger language plpgsql security definer set search_path='' as $$
declare r jsonb; snap jsonb;
begin
 r=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 if tg_table_name='fiscal_profiles' then
   snap=r - array['vat_number','tax_code','ateco','activity','notes','user_id','id','created_at','updated_at'];
 end if;
 -- auth.users cascades must not create a row referencing the deleted account.
 if exists(select 1 from auth.users where id=(r->>'user_id')::uuid) then
   insert into public.activity_logs(user_id,entity,entity_id,action,fiscal_snapshot) values((r->>'user_id')::uuid,tg_table_name,(r->>'id')::uuid,tg_op,snap);
 end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
do $$ declare t text; begin
 foreach t in array array['fiscal_profiles','invoices','payments','tax_payments','savings_reserves','deadlines'] loop
 execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.audit_private_change()',t);
 end loop;
end $$;

-- Serializes both document edits and receipts. A direct REST call cannot overpay or link another user's invoice.
create function public.guard_payment() returns trigger language plpgsql security definer set search_path='' as $$
declare inv public.invoices; received numeric;
begin
 if auth.uid() is null or auth.uid()<>new.user_id then raise exception 'Payment owner mismatch' using errcode='42501'; end if;
 if tg_op='UPDATE' and (new.invoice_id<>old.invoice_id or new.user_id<>old.user_id) then raise exception 'Payment relation is immutable' using errcode='23514'; end if;
 select * into inv from public.invoices where id=new.invoice_id and user_id=new.user_id for update;
 if inv.id is null or inv.state<>'issued' then raise exception 'Invoice unavailable for payment' using errcode='23514'; end if;
 select coalesce(sum(amount),0) into received from public.payments where invoice_id=new.invoice_id and id<>new.id;
 if received+new.amount>inv.total then raise exception 'Payment exceeds outstanding amount' using errcode='23514'; end if;
 return new;
end $$;
create trigger validate_payment before insert or update on public.payments for each row execute function public.guard_payment();
create function public.guard_invoice() returns trigger language plpgsql set search_path='' as $$
declare received numeric;
begin
 if tg_op='UPDATE' and (new.user_id<>old.user_id or new.id<>old.id) then raise exception 'Owner immutable'; end if;
 select coalesce(sum(amount),0) into received from public.payments where invoice_id=new.id;
 if received>0 and (new.state<>'issued' or new.total<received or new.client_id<>old.client_id) then raise exception 'Invoice has receipts' using errcode='23514'; end if;
 return new;
end $$;
create trigger validate_invoice before update on public.invoices for each row execute function public.guard_invoice();

-- All invoice writes are transactional RPCs. Table grants prevent bypassing derived totals.
revoke all on all tables in schema public from anon;
grant select on all tables in schema public to authenticated;
grant insert,update,delete on public.profiles,public.fiscal_profiles,public.clients,public.payments,public.tax_payments,public.savings_reserves,public.deadlines to authenticated;
revoke insert,update,delete on public.invoices,public.invoice_items,public.tax_estimates,public.activity_logs,public.tax_configurations from authenticated;

create function public.save_invoice(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid=auth.uid(); iid uuid; cid uuid; it jsonb; total_amount numeric=0; existing public.invoices;
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 cid=(payload->>'client_id')::uuid;
 if not exists(select 1 from public.clients where id=cid and user_id=uid) then raise exception 'Client unavailable' using errcode='42501'; end if;
 if jsonb_typeof(payload->'items')<>'array' or jsonb_array_length(payload->'items') not between 1 and 100 then raise exception 'Invalid items'; end if;
 if nullif(payload->>'id','') is not null then
   iid=(payload->>'id')::uuid;
   select * into existing from public.invoices where id=iid and user_id=uid for update;
   if existing.id is null then raise exception 'Invoice unavailable' using errcode='42501'; end if;
 else iid=gen_random_uuid(); end if;
 for it in select value from jsonb_array_elements(payload->'items') loop
   if (it->>'quantity')::numeric<=0 or (it->>'unit_price')::numeric<0 then raise exception 'Invalid item'; end if;
   total_amount=total_amount+round(round((it->>'quantity')::numeric,3)*round((it->>'unit_price')::numeric,2),2);
 end loop;
 if existing.id is null then
   insert into public.invoices(id,user_id,client_id,number,issue_date,due_date,state,description,total)
   values(iid,uid,cid,payload->>'number',(payload->>'issue_date')::date,(payload->>'due_date')::date,(payload->>'state')::public.invoice_state,coalesce(payload->>'description',''),total_amount);
 else
   update public.invoices set client_id=cid,number=payload->>'number',issue_date=(payload->>'issue_date')::date,due_date=(payload->>'due_date')::date,state=(payload->>'state')::public.invoice_state,description=coalesce(payload->>'description',''),total=total_amount where id=iid and user_id=uid;
 end if;
 delete from public.invoice_items where invoice_id=iid and user_id=uid;
 insert into public.invoice_items(user_id,invoice_id,description,quantity,unit_price,position)
 select uid,iid,x.value->>'description',(x.value->>'quantity')::numeric,(x.value->>'unit_price')::numeric,(x.ordinality-1)::integer from jsonb_array_elements(payload->'items') with ordinality as x(value,ordinality);
 return iid;
end $$;
create function public.delete_invoice(invoice_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 perform 1 from public.invoices where id=invoice_id and user_id=auth.uid() for update;
 if not found then raise exception 'Invoice unavailable' using errcode='42501'; end if;
 if exists(select 1 from public.payments p where p.invoice_id=delete_invoice.invoice_id and p.user_id=auth.uid()) then raise exception 'Invoice has receipts' using errcode='23514'; end if;
 delete from public.invoices where id=invoice_id and user_id=auth.uid();
end $$;
revoke all on function public.save_invoice(jsonb),public.delete_invoice(uuid),public.audit_private_change() from public,anon;
grant execute on function public.save_invoice(jsonb),public.delete_invoice(uuid) to authenticated;
