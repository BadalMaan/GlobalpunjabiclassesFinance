-- GLOBAL FINANCE DATABASE
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  mobile text,
  avatar_url text,
  share_percentage numeric(5,2) not null check (share_percentage >= 0 and share_percentage <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.income_entries (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  entry_date date not null default current_date,
  entry_time time not null default localtime,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table if not exists public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  expense_date date not null default current_date,
  expense_time time not null default localtime,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists income_entries_date_idx on public.income_entries(entry_date);
create index if not exists expense_entries_date_idx on public.expense_entries(expense_date);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

alter table public.profiles enable row level security;
alter table public.income_entries enable row level security;
alter table public.expense_entries enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "authenticated can view profiles" on public.profiles;
create policy "authenticated can view profiles"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "authenticated can update own profile" on public.profiles;
create policy "authenticated can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "authenticated can view income" on public.income_entries;
create policy "authenticated can view income"
on public.income_entries for select
to authenticated
using (true);

drop policy if exists "authenticated can insert income" on public.income_entries;
create policy "authenticated can insert income"
on public.income_entries for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "authenticated can update income" on public.income_entries;
create policy "authenticated can update income"
on public.income_entries for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated can view expenses" on public.expense_entries;
create policy "authenticated can view expenses"
on public.expense_entries for select
to authenticated
using (true);

drop policy if exists "authenticated can insert expenses" on public.expense_entries;
create policy "authenticated can insert expenses"
on public.expense_entries for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "authenticated can update expenses" on public.expense_entries;
create policy "authenticated can update expenses"
on public.expense_entries for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated can view audit logs" on public.audit_logs;
create policy "authenticated can view audit logs"
on public.audit_logs for select
to authenticated
using (true);

-- Profile auto-creation after a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, share_percentage)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'share_percentage')::numeric, 0)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- IMPORTANT:
-- For the production version, we will add database-side audit triggers
-- so edits/deletes are logged automatically and cannot be bypassed by UI.
