create table public.movements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  muscle_group text not null,
  secondary_muscles text[] default '{}'
);

alter table public.movements enable row level security;

create policy "Anyone logged in can view movements"
  on public.movements for select
  to authenticated
  using (true);