alter table public.profiles
    add constraint training_goal_check
    check (training_goal in ('hypertrophy', 'strength', 'general'));
