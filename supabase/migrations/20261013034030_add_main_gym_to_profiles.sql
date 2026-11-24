alter table public.profiles
  add column main_gym_id uuid references public.gyms(id) on delete set null;