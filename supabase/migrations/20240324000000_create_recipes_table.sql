-- Create recipes table
create table if not exists public.recipes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    description text not null,
    ingredients text[] not null,
    instructions text[] not null,
    calories integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.recipes enable row level security;

-- Create policies
create policy "Users can view their own recipes"
    on public.recipes for select
    using (auth.uid() = user_id);

create policy "Users can insert their own recipes"
    on public.recipes for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own recipes"
    on public.recipes for update
    using (auth.uid() = user_id);

create policy "Users can delete their own recipes"
    on public.recipes for delete
    using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_updated_at
    before update on public.recipes
    for each row
    execute function public.handle_updated_at(); 