-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing policies if they exist
drop policy if exists "Users can view their own settings" on public.user_settings;
drop policy if exists "Users can insert their own settings" on public.user_settings;
drop policy if exists "Users can update their own settings" on public.user_settings;

drop policy if exists "Users can view their own meals" on public.meals;
drop policy if exists "Users can insert their own meals" on public.meals;
drop policy if exists "Users can update their own meals" on public.meals;
drop policy if exists "Users can delete their own meals" on public.meals;

drop policy if exists "Users can view their own recipes" on public.recipes;
drop policy if exists "Users can insert their own recipes" on public.recipes;
drop policy if exists "Users can update their own recipes" on public.recipes;
drop policy if exists "Users can delete their own recipes" on public.recipes;

-- Drop existing triggers if they exist
drop trigger if exists handle_updated_at on public.user_settings;
drop trigger if exists handle_updated_at on public.meals;
drop trigger if exists handle_updated_at on public.recipes;

-- Drop existing function if it exists
drop function if exists public.handle_updated_at();

-- user_settings table
create table if not exists public.user_settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete cascade,
    calorie_goal integer,
    openai_key text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint user_settings_user_id_key unique (user_id)
);

-- meals table
create table if not exists public.meals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete cascade not null,
    description text not null,
    calories integer not null,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
    date date not null,
    is_custom_recipe boolean default false,
    recipe_id uuid references public.recipes(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- recipes table
create table if not exists public.recipes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete cascade not null,
    name text not null,
    description text not null,
    ingredients text[] default '{}',
    instructions text[] default '{}',
    calories integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.user_settings enable row level security;
alter table public.meals enable row level security;
alter table public.recipes enable row level security;

-- Create policies for user_settings
create policy "Users can view their own settings"
    on public.user_settings for select
    using (auth.uid() = user_id);

create policy "Users can insert their own settings"
    on public.user_settings for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own settings"
    on public.user_settings for update
    using (auth.uid() = user_id);

-- Create policies for meals
create policy "Users can view their own meals"
    on public.meals for select
    using (auth.uid() = user_id);

create policy "Users can insert their own meals"
    on public.meals for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own meals"
    on public.meals for update
    using (auth.uid() = user_id);

create policy "Users can delete their own meals"
    on public.meals for delete
    using (auth.uid() = user_id);

-- Create policies for recipes
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

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at
    before update on public.user_settings
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on public.meals
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on public.recipes
    for each row
    execute function public.handle_updated_at(); 