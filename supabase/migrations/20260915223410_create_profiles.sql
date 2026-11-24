create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    weight numeric,
    fitness_goal text,
    created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;