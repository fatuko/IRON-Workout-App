create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  split_day_id uuid references public.split_days(id) on delete set null,
  log_date date not null default current_date,
  week_number int check (week_number > 0),
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.workout_logs enable row level security;

create policy "Users can view own workout logs"
  on public.workout_logs for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can add own workout logs"
  on public.workout_logs for insert to authenticated
  with check (
    auth.uid() = user_id
    and (split_day_id is null or exists (
      select 1 from public.split_days
      where split_days.id = split_day_id and split_days.user_id = auth.uid()))
  );

create policy "Users can update own workout logs"
  on public.workout_logs for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (split_day_id is null or exists (
      select 1 from public.split_days
      where split_days.id = split_day_id and split_days.user_id = auth.uid()))
  );

create policy "Users can delete own workout logs"
  on public.workout_logs for delete to authenticated
  using (auth.uid() = user_id);