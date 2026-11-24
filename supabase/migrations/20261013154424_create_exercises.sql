create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  movement_id uuid not null references public.movements(id),
  gym_id uuid references public.gyms(id) on delete set null,
  machine_label text,
  rep_range_min int not null check (rep_range_min > 0),
  rep_range_max int not null,
  created_at timestamp with time zone default now(),
  check (rep_range_min <= rep_range_max)
);

alter table public.exercises enable row level security;