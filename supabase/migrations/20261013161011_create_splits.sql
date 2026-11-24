create table public.splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  split_type text not null check (split_type in
    ('upper_lower', 'ppl', 'full_body', 'bro_split', 'arnold', 'freestyle')),
  program_start_date date default current_date,
  created_at timestamp with time zone default now()
);

alter table public.splits enable row level security;

create policy "Users can view own splits"
  on public.splits for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can add own splits"
  on public.splits for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own splits"
  on public.splits for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own splits"
  on public.splits for delete to authenticated
  using (auth.uid() = user_id);