create policy "Users can view own exercises"
  on public.exercises for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add own exercises"
  on public.exercises for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own exercises"
  on public.exercises for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own exercises"
  on public.exercises for delete
  to authenticated
  using (auth.uid() = user_id);