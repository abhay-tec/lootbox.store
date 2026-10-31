-- Run this whole file in the Supabase SQL Editor for the Reclaim Edit project.

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null check (char_length(name) between 1 and 160),
  phone text not null check (char_length(phone) between 7 and 30),
  address text not null check (char_length(address) between 4 and 500),
  city text not null check (char_length(city) between 1 and 120),
  postal text not null check (char_length(postal) between 3 and 16),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '{}'::jsonb check (jsonb_typeof(items) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_alert_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_email text not null,
  product_name text not null check (char_length(product_name) between 1 and 200),
  product_image text not null default '',
  status text not null default 'waiting' check (status in ('waiting', 'contacted')),
  created_at timestamptz not null default now()
);

create table if not exists public.seller_allowlist (
  email text primary key check (email = lower(email))
);

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  customer_name text not null check (char_length(customer_name) between 1 and 160),
  customer_email text not null,
  customer_phone text not null check (char_length(customer_phone) between 7 and 30),
  delivery_address text not null check (char_length(delivery_address) between 4 and 500),
  delivery_city text not null check (char_length(delivery_city) between 1 and 120),
  delivery_postal text not null check (char_length(delivery_postal) between 3 and 16),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  status text not null default 'pending' check (status in ('pending', 'contacted', 'confirmed', 'fulfilled', 'cancelled')),
  cancelled_by text check (cancelled_by in ('seller', 'customer')),
  cancellation_reason text,
  created_at timestamptz not null default now()
);

alter table public.store_orders add column if not exists cancelled_by text;
alter table public.store_orders add column if not exists cancellation_reason text;
alter table public.store_orders drop constraint if exists store_orders_cancelled_by_check;
alter table public.store_orders add constraint store_orders_cancelled_by_check
  check (cancelled_by in ('seller', 'customer') or cancelled_by is null);
alter table public.store_orders drop constraint if exists store_orders_cancellation_reason_check;
alter table public.store_orders add constraint store_orders_cancellation_reason_check
  check (cancellation_reason in ('ordered_by_mistake', 'wrong_product', 'delivery_address_incorrect', 'no_longer_needed', 'other') or cancellation_reason is null);

create index if not exists store_orders_created_at_idx on public.store_orders (created_at desc);
create index if not exists store_orders_user_id_idx on public.store_orders (user_id, created_at desc);
create index if not exists stock_alert_requests_created_at_idx on public.stock_alert_requests (created_at desc);
create index if not exists stock_alert_requests_user_id_idx on public.stock_alert_requests (user_id, created_at desc);

alter table public.customer_profiles enable row level security;
alter table public.customer_carts enable row level security;
alter table public.stock_alert_requests enable row level security;
alter table public.seller_allowlist enable row level security;
alter table public.store_orders enable row level security;

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.role() = 'authenticated'
    and exists (
      select 1 from public.seller_allowlist s
      where s.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

revoke all on function public.is_seller() from public;
grant execute on function public.is_seller() to authenticated;

drop policy if exists "Customers read their own stock alerts" on public.stock_alert_requests;
create policy "Customers read their own stock alerts" on public.stock_alert_requests
  for select to authenticated using (
    user_id = auth.uid()
    and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb
  );
drop policy if exists "Google customers create stock alerts" on public.stock_alert_requests;
create policy "Google customers create stock alerts" on public.stock_alert_requests
  for insert to authenticated with check (
    user_id = auth.uid()
    and lower(customer_email) = lower(auth.jwt() ->> 'email')
    and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb
  );
drop policy if exists "Sellers read all stock alerts" on public.stock_alert_requests;
create policy "Sellers read all stock alerts" on public.stock_alert_requests
  for select to authenticated using (public.is_seller());
drop policy if exists "Sellers update stock alerts" on public.stock_alert_requests;
create policy "Sellers update stock alerts" on public.stock_alert_requests
  for update to authenticated using (public.is_seller()) with check (public.is_seller());
grant select, insert on public.stock_alert_requests to authenticated;
grant update (status) on public.stock_alert_requests to authenticated;

drop policy if exists "Customers read their own profile" on public.customer_profiles;
create policy "Customers read their own profile" on public.customer_profiles
  for select to authenticated using (
    user_id = auth.uid()
    and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb
  );
drop policy if exists "Customers create their own profile" on public.customer_profiles;
create policy "Customers create their own profile" on public.customer_profiles
  for insert to authenticated with check (
    user_id = auth.uid()
    and lower(email) = lower(auth.jwt() ->> 'email')
    and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb
  );
drop policy if exists "Customers update their own profile" on public.customer_profiles;
create policy "Customers update their own profile" on public.customer_profiles
  for update to authenticated using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and lower(email) = lower(auth.jwt() ->> 'email')
    and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb
  );
grant select, insert, update on public.customer_profiles to authenticated;

drop policy if exists "Customers read their own cart" on public.customer_carts;
create policy "Customers read their own cart" on public.customer_carts
  for select to authenticated using (
    user_id = auth.uid()
    and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb
  );
drop policy if exists "Customers create their own cart" on public.customer_carts;
create policy "Customers create their own cart" on public.customer_carts
  for insert to authenticated with check (
    user_id = auth.uid()
    and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb
  );
drop policy if exists "Customers update their own cart" on public.customer_carts;
create policy "Customers update their own cart" on public.customer_carts
  for update to authenticated
  using (user_id = auth.uid() and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb)
  with check (user_id = auth.uid() and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb);
grant select, insert, update on public.customer_carts to authenticated;

drop policy if exists "Customers and sellers read permitted orders" on public.store_orders;
create policy "Customers and sellers read permitted orders" on public.store_orders
  for select to authenticated using (
    (user_id = auth.uid() and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb)
    or public.is_seller()
  );
drop policy if exists "Customers place their own orders" on public.store_orders;
create policy "Customers place their own orders" on public.store_orders
  for insert to authenticated with check (
    user_id = auth.uid()
    and lower(customer_email) = lower(auth.jwt() ->> 'email')
    and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb
    and status = 'pending'
    and cancelled_by is null
  );
drop policy if exists "Sellers update order status" on public.store_orders;
create policy "Sellers update order status" on public.store_orders
  for update to authenticated using (public.is_seller()) with check (public.is_seller());
drop policy if exists "Customers cancel their own pending orders" on public.store_orders;
create policy "Customers cancel their own pending orders" on public.store_orders
  for update to authenticated using (
    user_id = auth.uid()
    and status = 'pending'
    and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb
  ) with check (
    user_id = auth.uid()
    and status = 'cancelled'
    and cancelled_by = 'customer'
    and auth.jwt() -> 'app_metadata' -> 'providers' @> '["google"]'::jsonb
  );
grant select, insert on public.store_orders to authenticated;
grant update (status, cancelled_by, cancellation_reason) on public.store_orders to authenticated;

revoke all on public.seller_allowlist from anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Only these two emails can access all orders in the seller dashboard.
insert into public.seller_allowlist (email) values
  ('abhaydubey77799@gmail.com'),
  ('ayushkushwaha0710@gmail.com')
on conflict (email) do nothing;

-- Create matching password logins manually in Supabase Authentication > Users;
-- the website intentionally has no seller signup.

-- Make new/updated RPC functions visible to the Supabase Data API immediately.
notify pgrst, 'reload schema';
