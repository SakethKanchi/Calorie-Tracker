-- Add recipe-related columns to meals table
alter table public.meals
add column if not exists is_custom_recipe boolean default false,
add column if not exists recipe_id uuid references public.recipes(id) on delete set null; 