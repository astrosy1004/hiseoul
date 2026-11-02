-- HiSeoul (하이서울) database schema for Supabase.
-- Run once in Supabase > SQL Editor.
-- Re-running it RESETS all HiSeoul tables (products, orders, staff) to the
-- sample data. 다시 실행하면 모든 데이터가 예시 데이터로 초기화돼요.

-- ---------------------------------------------------------------------------
-- Clean re-run
-- ---------------------------------------------------------------------------
drop table if exists public.order_events cascade;
drop table if exists public.order_lines cascade;
drop table if exists public.orders cascade;
drop table if exists public.rankings cascade;
drop table if exists public.products cascade;
drop table if exists public.hotels cascade;
drop table if exists public.staff cascade;
drop table if exists public.app_settings cascade;
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
  -- pending = waiting for payment; cancelled = payment failed or order cancelled
  status             text not null default 'pending' check (status in ('pending','paid','purchased','delivering','delivered','cancelled')),
  handover_photo_url text,
  locale             text not null default 'en' check (locale in ('en','ko','ja','zh-CN','zh-TW')),  -- language for emails
  notified_status    text,              -- last status we emailed the guest about
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

-- When each status was reached (shown on the guest's tracking page).
create table public.order_events (
  order_id text not null references public.orders(id) on delete cascade,
  status   text not null,
  at       timestamptz not null default now(),
  primary key (order_id, status)
);

-- Business settings, one row. Owner can change fees without a code release.
create table public.app_settings (
  id               integer primary key default 1 check (id = 1),
  service_fee_krw  integer not null default 4000 check (service_fee_krw between 0 and 100000),  -- TBD: 3,000-5,000
  delivery_fee_krw integer not null default 0 check (delivery_fee_krw between 0 and 100000),    -- TBD after courier quotes
  cutoff_hour      integer not null default 15 check (cutoff_hour between 0 and 23),  -- same-day orders until 15:00 KST
  min_lead_hours   integer not null default 3 check (min_lead_hours between 0 and 12), -- a slot must start at least this many hours after ordering
  test_payments    boolean not null default true    -- true until a real payment provider is connected
);
insert into public.app_settings default values;

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
  select (to_jsonb(o) - 'notified_status') || jsonb_build_object(
           'lines', coalesce((select jsonb_agg(to_jsonb(l)) from public.order_lines l where l.order_id = o.id), '[]'::jsonb),
           'events', coalesce((select jsonb_object_agg(e.status, e.at) from public.order_events e where e.order_id = o.id), '{}'::jsonb))
    from public.orders o
   where upper(o.id) = upper(trim(p_id)) and lower(o.email) = lower(trim(p_email))
$$;

-- Guest checkout. Prices, fees and stock come from the database, never from
-- the browser. Creates the order as 'pending' (waiting for payment).
-- p: {"email","guest_name","hotel_id","room","delivery_date","slot","payment_method","lines":[{"product_id","qty"}]}
create or replace function public.create_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  s       public.app_settings;
  kst     timestamp := now() at time zone 'Asia/Seoul';
  d       date;
  v_id    text;
  v_items integer;
  v_lines integer;
  v_ok    integer;
begin
  select * into s from public.app_settings where id = 1;
  if jsonb_typeof(p -> 'lines') is distinct from 'array' or jsonb_array_length(p -> 'lines') not between 1 and 20 then raise exception 'invalid_lines'; end if;
  if length(trim(coalesce(p ->> 'guest_name', ''))) not between 1 and 80 then raise exception 'invalid_name'; end if;
  if coalesce(p ->> 'email', '') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(p ->> 'email') > 200 then raise exception 'invalid_email'; end if;
  if length(coalesce(p ->> 'room', '')) > 20 then raise exception 'invalid_room'; end if;
  if not exists (select 1 from public.hotels h where h.id = p ->> 'hotel_id' and h.active) then raise exception 'invalid_hotel'; end if;

  if coalesce(p ->> 'slot', '') not in ('12-15','15-18','18-21','21-23') then raise exception 'invalid_slot'; end if;
  if coalesce(p ->> 'payment_method', '') not in ('card','alipay','wechatpay','paypay','linepay','grabpay') then raise exception 'invalid_payment_method'; end if;
  begin d := (p ->> 'delivery_date')::date; exception when others then raise exception 'invalid_date'; end;
  if d < kst::date or d > kst::date + 7 then raise exception 'invalid_date'; end if;
  if d = kst::date and (extract(hour from kst) >= s.cutoff_hour
      or split_part(p ->> 'slot', '-', 1)::int < extract(hour from kst) + s.min_lead_hours) then
    raise exception 'slot_closed';
  end if;

  -- Merge duplicate lines, then check every product is on sale.
  create temp table if not exists _req (product_id text primary key, qty integer) on commit drop;
  delete from _req;
  insert into _req
    select x ->> 'product_id', sum((x ->> 'qty')::int)
      from jsonb_array_elements(p -> 'lines') x group by 1;
  if exists (select 1 from _req where qty not between 1 and 10) then raise exception 'invalid_qty'; end if;
  select count(*) into v_lines from _req;
  select count(*), coalesce(sum(r.qty * pr.store_price_krw), 0) into v_ok, v_items
    from _req r join public.products pr on pr.id = r.product_id
   where pr.visible and pr.stock <> 'sold_out';
  if v_ok <> v_lines then raise exception 'unavailable_item'; end if;

  insert into public.orders (email, guest_name, hotel_id, room, delivery_date, slot,
                             items_krw, service_fee_krw, delivery_fee_krw, total_krw, payment_method, status, locale)
  values (lower(trim(p ->> 'email')), trim(p ->> 'guest_name'), p ->> 'hotel_id', nullif(trim(coalesce(p ->> 'room', '')), ''),
          d, p ->> 'slot', v_items, s.service_fee_krw, s.delivery_fee_krw,
          v_items + s.service_fee_krw + s.delivery_fee_krw, p ->> 'payment_method', 'pending',
          case when p ->> 'locale' in ('en','ko','ja','zh-CN','zh-TW') then p ->> 'locale' else 'en' end)
  returning id into v_id;

  insert into public.order_lines (order_id, product_id, qty, unit_price_krw)
    select v_id, r.product_id, r.qty, pr.store_price_krw from _req r join public.products pr on pr.id = r.product_id;
  return v_id;
end $$;

-- Test payments only: marks a pending order as paid. Refuses once
-- app_settings.test_payments is turned off (a real provider confirms
-- payments from the server with its own secret key instead).
create or replace function public.confirm_test_payment(p_id text, p_email text) returns text
language plpgsql security definer set search_path = public as $$
begin
  if not (select test_payments from public.app_settings where id = 1) then raise exception 'test_payments_off'; end if;
  update public.orders set status = 'paid'
   where id = upper(trim(p_id)) and lower(email) = lower(trim(p_email)) and status = 'pending';
  if not found then raise exception 'not_pending'; end if;
  return 'paid';
end $$;

-- Owner/manager: replace one region's ranking with a new order of products.
-- "change" compares with the previous saved order (+ moved up), new entries get NEW.
create or replace function public.save_ranking(p_region text, p_ids text[]) returns void
language plpgsql set search_path = public as $$
declare n integer := coalesce(array_length(p_ids, 1), 0);
begin
  if not public.has_role(array['owner','manager']) then raise exception 'forbidden'; end if;
  if p_region not in ('all','japan','greater_china','sea','americas') then raise exception 'invalid_region'; end if;
  if n > 100 then raise exception 'too_many'; end if;
  if (select count(distinct x) from unnest(p_ids) x) <> n then raise exception 'duplicate_product'; end if;
  if (select count(*) from public.products where id = any(p_ids)) <> n then raise exception 'unknown_product'; end if;
  drop table if exists _old_rank;
  create temp table _old_rank on commit drop as select product_id, rank from public.rankings where region = p_region;
  delete from public.rankings where region = p_region;
  insert into public.rankings (region, rank, product_id, change, is_new)
    select p_region, t.ord, t.id, coalesce(o.rank - t.ord, 0), o.rank is null
      from unnest(p_ids) with ordinality as t(id, ord)
      left join _old_rank o on o.product_id = t.id;
end $$;

-- Record when each status is reached.
create or replace function public.log_order_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_events (order_id, status) values (new.id, new.status)
    on conflict (order_id, status) do update set at = now();
  end if;
  return new;
end $$;

-- Server only (secret key): picks the guest email that is due for an order.
-- Marks it as sent in the same step so two calls never send twice; returns
-- null when nothing is due. The caller puts p_prev back if sending fails.
create or replace function public.claim_notification(p_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders; prev text;
begin
  select * into o from public.orders where id = p_id for update;
  if not found or o.status not in ('paid','delivering','delivered') or o.notified_status is not distinct from o.status then return null; end if;
  -- Don't send "on the way" after "delivered" was already sent.
  if o.notified_status = 'delivered' then return null; end if;
  prev := o.notified_status;
  update public.orders set notified_status = o.status where id = p_id;
  return to_jsonb(o) || jsonb_build_object(
    'prev', prev,
    'hotel', (select to_jsonb(h) from public.hotels h where h.id = o.hotel_id),
    'lines', coalesce((select jsonb_agg(jsonb_build_object('qty', l.qty, 'unit_price_krw', l.unit_price_krw, 'name', p.name))
                         from public.order_lines l join public.products p on p.id = l.product_id where l.order_id = o.id), '[]'::jsonb));
end $$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
create trigger orders_events after insert or update of status on public.orders for each row execute function public.log_order_event();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.products    enable row level security;
alter table public.rankings    enable row level security;
alter table public.hotels      enable row level security;
alter table public.staff       enable row level security;
alter table public.orders      enable row level security;
alter table public.order_lines enable row level security;
alter table public.app_settings enable row level security;
alter table public.order_events enable row level security;
create policy events_read on public.order_events for select using (public.has_role(array['owner','manager','staff']));

create policy settings_read   on public.app_settings for select using (true);
create policy settings_write  on public.app_settings for update using (public.has_role(array['owner'])) with check (public.has_role(array['owner']));

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
grant execute on function public.create_order(jsonb) to anon, authenticated;
grant execute on function public.confirm_test_payment(text, text) to anon, authenticated;
grant execute on function public.save_ranking(text, text[]) to authenticated;
revoke execute on function public.save_ranking(text, text[]) from public, anon;
revoke execute on function public.claim_notification(text) from public, anon, authenticated;
grant execute on function public.claim_notification(text) to service_role;
revoke execute on function public.log_order_event() from public, anon, authenticated;
grant execute on function public.staff_me() to authenticated;
grant execute on function public.staff_list() to authenticated;
revoke execute on function public.staff_me() from public, anon;
revoke execute on function public.staff_list() from public, anon;

-- ---------------------------------------------------------------------------
-- Photos (Supabase Storage). Anyone can view. Product photos: owner/manager
-- upload. Handover photos: any staff member uploads.
-- If this part fails it only prints a notice; the rest of the setup still works.
-- ---------------------------------------------------------------------------
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
  drop policy if exists product_images_insert on storage.objects;
  drop policy if exists product_images_update on storage.objects;
  drop policy if exists product_images_delete on storage.objects;
  create policy product_images_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'product-images' and public.has_role(array['owner','manager']));
  create policy product_images_update on storage.objects for update to authenticated
    using (bucket_id = 'product-images' and public.has_role(array['owner','manager']));
  create policy product_images_delete on storage.objects for delete to authenticated
    using (bucket_id = 'product-images' and public.has_role(array['owner','manager']));

  -- Handover photos: taken by any staff member at the hotel front desk.
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('handover-photos', 'handover-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
  drop policy if exists handover_photos_insert on storage.objects;
  create policy handover_photos_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'handover-photos' and public.has_role(array['owner','manager','staff']));
exception when others then
  raise notice 'Photo storage was not set up: %', sqlerrm;
end $$;
