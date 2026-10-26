create extension if not exists pgcrypto;

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null check (char_length(product_slug) between 1 and 140),
  product_name text not null check (char_length(product_name) between 1 and 180),
  reviewer_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 1 and 500),
  created_at timestamptz not null default now(),
  unique (product_slug, reviewer_id)
);

alter table public.product_reviews enable row level security;

drop policy if exists "Anyone can read product reviews" on public.product_reviews;
create policy "Anyone can read product reviews"
  on public.product_reviews for select to anon, authenticated
  using (true);

drop policy if exists "Visitors can post product reviews" on public.product_reviews;
create policy "Visitors can post product reviews"
  on public.product_reviews for insert to anon, authenticated
  with check (
    rating between 1 and 5
    and char_length(comment) between 1 and 500
    and char_length(product_name) between 1 and 180
  );

grant select, insert on public.product_reviews to anon, authenticated;

create or replace function public.get_product_review_summaries()
returns table (product_slug text, average_rating numeric, review_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select r.product_slug, round(avg(r.rating)::numeric, 1), count(*)
  from public.product_reviews as r
  group by r.product_slug;
$$;

grant execute on function public.get_product_review_summaries() to anon, authenticated;
