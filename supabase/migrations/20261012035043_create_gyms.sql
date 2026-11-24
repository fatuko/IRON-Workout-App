create table public.gyms (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    name text not null,
    created_at timestamp with time zone default now()
);

alter table public.gyms enable row level security;