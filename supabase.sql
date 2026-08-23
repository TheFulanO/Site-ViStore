-- Vi Store v1.0 — PostgreSQL/Supabase schema
create extension if not exists pgcrypto;

create type public.user_role as enum ('customer','admin');
create type public.order_status as enum ('pending','paid','cancelled');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  username text unique,
  role public.user_role not null default 'customer',
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price numeric(12,2) not null default 0,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  platform text not null,
  version text,
  featured boolean not null default false,
  active boolean not null default true,
  cover_url text,
  gallery_urls text[] not null default '{}',
  video_url text,
  changelog text,
  faq jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check(discount_type in ('percent','fixed')),
  value numeric(12,2) not null,
  usage_limit integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total numeric(12,2) not null default 0,
  coupon_id uuid references public.coupons(id) on delete set null,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null
);

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  version text,
  file_url text not null,
  released_at timestamptz not null default now()
);

-- Create profile automatically after signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id,name,username)
  values(new.id,new.raw_user_meta_data->>'name',new.raw_user_meta_data->>'username')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.downloads enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and blocked=false);
$$;

create policy "public can read active products" on public.products for select using (active=true or public.is_admin());
create policy "public can read categories" on public.categories for select using (true);
create policy "user reads own profile" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "user updates own profile" on public.profiles for update using (id=auth.uid() or public.is_admin());

create policy "user creates orders" on public.orders for insert with check (user_id=auth.uid());
create policy "user reads own orders" on public.orders for select using (user_id=auth.uid() or public.is_admin());
create policy "user creates order items" on public.order_items for insert with check (
  exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid())
);
create policy "user reads own order items" on public.order_items for select using (
  exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin()))
);
create policy "user reads own downloads" on public.downloads for select using (user_id=auth.uid() or public.is_admin());

-- Admin write policies
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage coupons" on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage downloads" on public.downloads for all using (public.is_admin()) with check (public.is_admin());

-- Storage buckets to create in Supabase Storage:
-- products (public): covers/gallery/video previews
-- downloads (private): purchased files
