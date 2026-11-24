create policy "Users can view own gyms"
  on public.gyms for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add own gyms"
  on public.gyms for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own gyms"
  on public.gyms for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own gyms"
  on public.gyms for delete
  to authenticated
  using (auth.uid() = user_id);