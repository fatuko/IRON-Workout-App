create table public.split_days (
  id uuid primary key default gen_random_uuid(),
  split_id uuid not null references public.splits(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  order_index int not null check (order_index >= 0),
  created_at timestamp with time zone default now()
);

alter table public.split_days enable row level security;

create policy "Users can view own split days"
  on public.split_days for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can add own split days"
  on public.split_days for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.splits
                where splits.id = split_id and splits.user_id = auth.uid())
  );

create policy "Users can update own split days"
  on public.split_days for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.splits
                where splits.id = split_id and splits.user_id = auth.uid())
  );

create policy "Users can delete own split days"
  on public.split_days for delete to authenticated
  using (auth.uid() = user_id);