create table public.split_day_exercises (
  id uuid primary key default gen_random_uuid(),
  split_day_id uuid not null references public.split_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_index int not null check (order_index >= 0),
  created_at timestamp with time zone default now()
);

alter table public.split_day_exercises enable row level security;

create policy "Users can view own split day exercises"
  on public.split_day_exercises for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can add own split day exercises"
  on public.split_day_exercises for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.split_days
                where split_days.id = split_day_id and split_days.user_id = auth.uid())
    and exists (select 1 from public.exercises
                where exercises.id = exercise_id and exercises.user_id = auth.uid())
  );

create policy "Users can update own split day exercises"
  on public.split_day_exercises for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.split_days
                where split_days.id = split_day_id and split_days.user_id = auth.uid())
    and exists (select 1 from public.exercises
                where exercises.id = exercise_id and exercises.user_id = auth.uid())
  );

create policy "Users can delete own split day exercises"
  on public.split_day_exercises for delete to authenticated
  using (auth.uid() = user_id);