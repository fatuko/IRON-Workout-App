-- PART 1: the function (What to do)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin 
    insert into public.profiles (id)
    values (new.id);
    return new;
end;
$$;

-- Part 2: the trigger (When to do it)
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();