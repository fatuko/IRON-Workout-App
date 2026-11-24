alter table public.profiles
    add constraint training_experience_check
    check (training_experience in ('novice', 'intermediate', 'advanced'));