create table public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references public.workout_logs(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  set_number int not null check (set_number > 0),
  weight numeric(6,2) not null check (weight >= 0),
  reps int not null check (reps > 0),
  rir int check (rir between 0 and 5),
  estimated_1rm numeric(6,2),
  created_at timestamp with time zone default now()
);

alter table public.sets enable row level security;

create policy "Users can view own sets"
  on public.sets for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can add own sets"
  on public.sets for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.workout_logs
                where workout_logs.id = workout_log_id and workout_logs.user_id = auth.uid())
    and (exercise_id is null or exists (select 1 from public.exercises
                where exercises.id = exercise_id and exercises.user_id = auth.uid()))
  );

create policy "Users can update own sets"
  on public.sets for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.workout_logs
                where workout_logs.id = workout_log_id and workout_logs.user_id = auth.uid())
    and (exercise_id is null or exists (select 1 from public.exercises
                where exercises.id = exercise_id and exercises.user_id = auth.uid()))
  );

create policy "Users can delete own sets"
  on public.sets for delete to authenticated
  using (auth.uid() = user_id);