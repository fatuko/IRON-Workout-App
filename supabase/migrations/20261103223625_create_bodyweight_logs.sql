create table public.bodyweight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  weight numeric(5,2) not null check (weight > 0),
  created_at timestamp with time zone default now(),
  unique (user_id, log_date)
);

alter table public.bodyweight_logs enable row level security;

create policy "Users can view own bodyweight logs"
  on public.bodyweight_logs for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can add own bodyweight logs"
  on public.bodyweight_logs for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own bodyweight logs"
  on public.bodyweight_logs for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own bodyweight logs"
  on public.bodyweight_logs for delete to authenticated
  using (auth.uid() = user_id);