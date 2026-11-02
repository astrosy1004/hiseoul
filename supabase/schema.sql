-- HiSeoul (하이서울) database schema for Supabase.
-- Run once in Supabase > SQL Editor. Safe to re-run: it drops and recreates
-- Re-running it RESETS all HiSeoul tables (products, orders, staff) to the
-- sample data. 다시 실행하면 모든 데이터가 예시 데이터로 초기화돼요.
-- ---------------------------------------------------------------------------
-- Clean re-run
-- ---------------------------------------------------------------------------
drop table if exists public.order_lines cascade;
drop table if exists public.orders cascade;
drop table if exists public.rankings cascade;
drop table if exists public.products cascade;
drop table if exists public.hotels cascade;
drop table if exists public.staff cascade;
drop sequence if exists public.order_no;

-- ---------------------------------------------------------------------------
-- Tables (mirror src/lib/types.ts)
-- ---------------------------------------------------------------------------
create table public.products (
  id              text primary key,
  category        text not null check (category in ('beauty','kpop','fashion')),
  brand           jsonb not null,            -- {"en": "...", "ko": "...", ...}
  name            jsonb not null,
  description     jsonb not null default '{"en": ""}',
  store_price_krw integer not null check (store_price_krw >= 0),
  image_url       text,
  rating          numeric(2,1) not null default 0,
  review_count    integer not null default 0,
  skin_types      text[],
  concerns        text[],
  routine_step    text check (routine_step in ('toner','essence','cream','sun')),
  visible         boolean not null default false,
  stock           text not null default 'in_stock' check (stock in ('in_stock','low','sold_out')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.rankings (
  region     text not null check (region in ('all','japan','greater_china','sea','americas')),
  rank       integer not null check (rank between 1 and 100),
  product_id text not null references public.products(id) on delete cascade,
  change     integer not null default 0,   -- vs yesterday (+ up, - down)
  is_new     boolean not null default false,
  primary key (region, rank)
);

create table public.hotels (
  id     text primary key,
  name   jsonb not null,
  area   text not null check (area in ('myeongdong','hongdae','gangnam','itaewon','jamsil','gwanghwamun')),
  active boolean not null default true
);

create table public.staff (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique references auth.users(id) on delete set null,
  name          text not null,
  email         text not null unique check (email = lower(email)),
  role          text not null check (role in ('owner','manager','staff')),
  active        boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now()
);

create sequence public.order_no start 1043;

create table public.orders (
  id                 text primary key default ('HS-' || nextval('public.order_no')),
  created_at         timestamptz not null default now(),
  email              text not null,
  guest_name         text not null,
  hotel_id           text not null references public.hotels(id),
  room               text,
  delivery_date      date not null,
  slot               text not null check (slot in ('12-15','15-18','18-21','21-23')),
  items_krw          integer not null,
  service_fee_krw    integer not null,
  delivery_fee_krw   integer not null,
  total_krw          integer not null,
  payment_method     text not null check (payment_method in ('card','alipay','wechatpay','paypay','linepay','grabpay')),
  status             text not null default 'paid' check (status in ('paid','purchased','delivering','delivered')),
  handover_photo_url text,
  updated_at         timestamptz not null default now()
);
create index orders_delivery_date_idx on public.orders (delivery_date, status);

create table public.order_lines (
  order_id       text not null references public.orders(id) on delete cascade,
  product_id     text not null references public.products(id),
  qty            integer not null check (qty > 0),
  unit_price_krw integer not null,
  primary key (order_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Helpers: who is the signed-in staff member?
-- A staff member counts only when the account is active AND the session passed
-- the authenticator-app step (aal2).
-- ---------------------------------------------------------------------------
create or replace function public.staff_role() returns text
language sql stable security definer set search_path = public as $$
  select s.role from public.staff s
  where s.active
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    and (s.user_id = auth.uid() or (s.user_id is null and s.email = lower(auth.jwt() ->> 'email')))
  limit 1
$$;

create or replace function public.has_role(roles text[]) returns boolean
language sql stable as $$ select coalesce(public.staff_role() = any(roles), false) $$;

-- Called right after login: links the auth user to its staff row, stamps the
-- login time and returns the staff profile (or nothing for non-staff).
create or replace function public.staff_me() returns setof public.staff
language plpgsql security definer set search_path = public as $$
begin
  if public.staff_role() is null then return; end if;
  update public.staff
     set user_id = auth.uid(), last_login_at = now()
   where active and (user_id = auth.uid() or (user_id is null and email = lower(auth.jwt() ->> 'email')));
  return query select * from public.staff where user_id = auth.uid();
end $$;

-- Owner-only staff list, including whether each person finished the
-- authenticator-app setup.
create or replace function public.staff_list()
returns table (id uuid, name text, email text, role text, active boolean, last_login_at timestamptz, mfa_enabled boolean)
language sql stable security definer set search_path = public, auth as $$
  select s.id, s.name, s.email, s.role, s.active, s.last_login_at,
         exists (select 1 from auth.mfa_factors f where f.user_id = s.user_id and f.status = 'verified')
    from public.staff s
   where public.has_role(array['owner'])
   order by case s.role when 'owner' then 0 when 'manager' then 1 else 2 end, s.created_at
$$;

-- Guest order lookup: order number + email, no account needed.
create or replace function public.lookup_order(p_id text, p_email text) returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(o) || jsonb_build_object('lines',
           coalesce((select jsonb_agg(to_jsonb(l)) from public.order_lines l where l.order_id = o.id), '[]'::jsonb))
    from public.orders o
   where upper(o.id) = upper(trim(p_id)) and lower(o.email) = lower(trim(p_email))
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.products    enable row level security;
alter table public.rankings    enable row level security;
alter table public.hotels      enable row level security;
alter table public.staff       enable row level security;
alter table public.orders      enable row level security;
alter table public.order_lines enable row level security;

-- Shoppers see visible products; owner/manager see and edit everything.
create policy products_read   on public.products for select using (visible or public.has_role(array['owner','manager','staff']));
create policy products_write  on public.products for all    using (public.has_role(array['owner','manager'])) with check (public.has_role(array['owner','manager']));

create policy rankings_read   on public.rankings for select using (true);
create policy rankings_write  on public.rankings for all    using (public.has_role(array['owner','manager'])) with check (public.has_role(array['owner','manager']));

create policy hotels_read     on public.hotels for select using (active or public.has_role(array['owner','manager','staff']));
create policy hotels_write    on public.hotels for all    using (public.has_role(array['owner','manager'])) with check (public.has_role(array['owner','manager']));

-- Orders: staff only. Shoppers read their order through lookup_order();
-- creating orders comes with payments in step 5.
create policy orders_read     on public.orders for select using (public.has_role(array['owner','manager','staff']));
create policy orders_update   on public.orders for update using (public.has_role(array['owner','manager','staff'])) with check (public.has_role(array['owner','manager','staff']));
create policy lines_read      on public.order_lines for select using (public.has_role(array['owner','manager','staff']));

-- Staff accounts: owner manages; everyone else only through staff_me().
create policy staff_owner     on public.staff for all using (public.has_role(array['owner'])) with check (public.has_role(array['owner']));

-- Staff may only change an order's status / handover photo, not the money.
revoke update on public.orders from anon, authenticated;
grant  update (status, handover_photo_url) on public.orders to authenticated;

grant execute on function public.lookup_order(text, text) to anon, authenticated;
grant execute on function public.staff_me() to authenticated;
grant execute on function public.staff_list() to authenticated;
revoke execute on function public.staff_me() from public, anon;
revoke execute on function public.staff_list() from public, anon;
