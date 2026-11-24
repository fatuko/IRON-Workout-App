-- weight changes over time, so it'll get its own table later
alter table public.profiles drop column weight;

-- match the name in the plan
alter table public.profiles rename column fitness_goal to training_goal;

-- new columns
alter table public.profiles add column display_name text;
alter table public.profiles add column training_expierence text;
