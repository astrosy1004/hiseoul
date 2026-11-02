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


-- Sample data (fictional brands/products). Generated by scripts/make-seed.mjs.
begin;
insert into public.products (id, category, brand, name, description, store_price_krw, image_url, rating, review_count, skin_types, concerns, routine_step, visible, stock) values
  ('b1', 'beauty', '{"en":"Dewlab","ko":"듀랩"}'::jsonb, '{"en":"Snail Mucin 96 Essence 100ml","ko":"스네일 뮤신 96 에센스 100ml","ja":"スネイルムチン96エッセンス","zh-CN":"蜗牛黏液96精华","zh-TW":"蝸牛黏液96精華"}'::jsonb, '{"en":"Lightweight essence with 96% snail secretion filtrate that hydrates dry, sensitive skin.","ko":"달팽이 점액 여과물 96%로 건조하고 예민한 피부에 수분을 채워 주는 가벼운 에센스."}'::jsonb, 21000, null, 4.8, 12840, array['dry','combination','sensitive']::text[], array['hydration','aging']::text[], 'essence', true, 'in_stock'),
  ('b2', 'beauty', '{"en":"Sun Daily","ko":"선데일리"}'::jsonb, '{"en":"Watery Sun Cream SPF50+","ko":"워터리 선크림 SPF50+"}'::jsonb, '{"en":"No white cast, no stickiness.","ko":"백탁 없이 산뜻한 데일리 선크림."}'::jsonb, 15000, null, 4.8, 20113, array['dry','oily','combination','sensitive']::text[], array['aging','brightening']::text[], 'sun', true, 'in_stock'),
  ('b3', 'beauty', '{"en":"Cica Garden","ko":"시카가든"}'::jsonb, '{"en":"Centella Calming Cream","ko":"센텔라 진정 크림"}'::jsonb, '{"en":"Soothes redness and strengthens the skin barrier.","ko":"붉은기를 진정시키고 피부 장벽을 강화해요."}'::jsonb, 24000, null, 4.9, 15011, array['sensitive','combination','dry']::text[], array['acne','hydration']::text[], 'cream', true, 'in_stock'),
  ('b4', 'beauty', '{"en":"Seoul Glow","ko":"서울글로우"}'::jsonb, '{"en":"Rice Water Brightening Toner","ko":"쌀뜨물 브라이트닝 토너"}'::jsonb, '{"en":"Fermented rice toner for an even, glassy tone.","ko":"발효 쌀 성분으로 맑고 고른 피부 톤."}'::jsonb, 18000, null, 4.7, 8320, array['dry','oily','combination']::text[], array['brightening']::text[], 'toner', true, 'in_stock'),
  ('b5', 'beauty', '{"en":"Pore Hero","ko":"포어히어로"}'::jsonb, '{"en":"BHA Blackhead Pads (70)","ko":"BHA 블랙헤드 패드 70매"}'::jsonb, '{"en":"Gentle daily exfoliating pads for clear pores.","ko":"매일 쓰는 순한 각질 패드."}'::jsonb, 16000, null, 4.7, 9302, array['oily','combination']::text[], array['pores','acne']::text[], 'toner', true, 'low'),
  ('b6', 'beauty', '{"en":"Tint Studio","ko":"틴트스튜디오"}'::jsonb, '{"en":"Glass Lip Tint Set","ko":"글래스 립 틴트 세트"}'::jsonb, '{"en":"Three juicy colors in one set.","ko":"물기 가득한 3가지 컬러 세트."}'::jsonb, 22000, null, 4.6, 6120, null, null, null, true, 'in_stock'),
  ('b7', 'beauty', '{"en":"Hanbang Lab","ko":"한방랩"}'::jsonb, '{"en":"Ginseng Firming Serum","ko":"인삼 탄력 세럼"}'::jsonb, '{"en":"Korean herbal serum for elasticity.","ko":"인삼 성분의 탄력 세럼."}'::jsonb, 45000, null, 4.6, 4210, array['dry','combination']::text[], array['aging']::text[], 'essence', true, 'in_stock'),
  ('b8', 'beauty', '{"en":"Mask Day","ko":"마스크데이"}'::jsonb, '{"en":"Sheet Mask 30-Day Pack","ko":"시트 마스크 30일 팩"}'::jsonb, '{"en":"30 masks, 6 formulas.","ko":"6가지 포뮬러, 30장."}'::jsonb, 30000, null, 4.5, 3880, null, null, null, false, 'sold_out'),
  ('k1', 'kpop', '{"en":"Starlight Ent.","ko":"스타라이트"}'::jsonb, '{"en":"New Mini Album (Random Ver.)","ko":"신규 미니앨범 (랜덤)"}'::jsonb, '{"en":"Photobook, random photocard and poster included.","ko":"포토북, 랜덤 포토카드, 포스터 포함."}'::jsonb, 19800, null, 4.8, 18320, null, null, null, true, 'in_stock'),
  ('k2', 'kpop', '{"en":"Starlight Ent.","ko":"스타라이트"}'::jsonb, '{"en":"Official Light Stick Ver.3","ko":"공식 응원봉 Ver.3"}'::jsonb, '{"en":"Bluetooth-synced light stick.","ko":"블루투스 연동 응원봉."}'::jsonb, 55000, null, 4.9, 7210, null, null, null, true, 'low'),
  ('k3', 'kpop', '{"en":"Idol Goods","ko":"아이돌굿즈"}'::jsonb, '{"en":"Photocard Binder","ko":"포토카드 바인더"}'::jsonb, '{"en":"Protect and show off your collection.","ko":"포토카드 보관 바인더."}'::jsonb, 14000, null, 4.7, 5320, null, null, null, true, 'in_stock'),
  ('f1', 'fashion', '{"en":"Seongsu Studio","ko":"성수스튜디오"}'::jsonb, '{"en":"Oversized Logo Hoodie","ko":"오버핏 로고 후디"}'::jsonb, '{"en":"The Seongsu-dong look.","ko":"성수동 감성 후디."}'::jsonb, 59000, null, 4.6, 3120, null, null, null, true, 'in_stock'),
  ('f2', 'fashion', '{"en":"Hanok Wear","ko":"한옥웨어"}'::jsonb, '{"en":"Modern Hanbok Jacket","ko":"모던 한복 재킷"}'::jsonb, '{"en":"Traditional lines, everyday comfort.","ko":"전통 라인의 데일리 재킷."}'::jsonb, 89000, null, 4.8, 1210, null, null, null, true, 'in_stock'),
  ('f3', 'fashion', '{"en":"Seongsu Studio","ko":"성수스튜디오"}'::jsonb, '{"en":"Bucket Hat","ko":"버킷햇"}'::jsonb, '{"en":"Lightweight and easy to pack.","ko":"가볍고 챙기기 쉬운 버킷햇."}'::jsonb, 29000, null, 4.4, 1950, null, null, null, true, 'in_stock');
insert into public.rankings (region, rank, product_id, change, is_new) values
  ('all', 1, 'b1', 3, false),
  ('all', 2, 'b2', 0, false),
  ('all', 3, 'b3', 1, false),
  ('all', 4, 'k1', 0, true),
  ('all', 5, 'b4', -1, false),
  ('all', 6, 'b5', 2, false),
  ('all', 7, 'f1', 0, false),
  ('all', 8, 'k2', 5, false),
  ('all', 9, 'b6', -2, false),
  ('all', 10, 'b7', 0, false),
  ('japan', 1, 'b1', 3, false),
  ('japan', 2, 'b3', 0, false),
  ('japan', 3, 'b2', 1, false),
  ('japan', 4, 'b6', 0, true),
  ('japan', 5, 'k1', -1, false),
  ('japan', 6, 'b4', 2, false),
  ('japan', 7, 'b5', 0, false),
  ('japan', 8, 'k3', 5, false),
  ('japan', 9, 'f3', -2, false),
  ('japan', 10, 'b7', 0, false),
  ('greater_china', 1, 'b7', 3, false),
  ('greater_china', 2, 'b1', 0, false),
  ('greater_china', 3, 'b2', 1, false),
  ('greater_china', 4, 'b3', 0, true),
  ('greater_china', 5, 'f2', -1, false),
  ('greater_china', 6, 'b4', 2, false),
  ('greater_china', 7, 'k2', 0, false),
  ('greater_china', 8, 'b6', 5, false),
  ('greater_china', 9, 'b5', -2, false),
  ('greater_china', 10, 'k1', 0, false),
  ('sea', 1, 'b2', 3, false),
  ('sea', 2, 'b1', 0, false),
  ('sea', 3, 'k1', 1, false),
  ('sea', 4, 'b5', 0, true),
  ('sea', 5, 'b3', -1, false),
  ('sea', 6, 'k2', 2, false),
  ('sea', 7, 'b4', 0, false),
  ('sea', 8, 'f1', 5, false),
  ('sea', 9, 'k3', -2, false),
  ('sea', 10, 'b6', 0, false),
  ('americas', 1, 'b1', 3, false),
  ('americas', 2, 'b2', 0, false),
  ('americas', 3, 'f2', 1, false),
  ('americas', 4, 'b3', 0, true),
  ('americas', 5, 'k1', -1, false),
  ('americas', 6, 'b4', 2, false),
  ('americas', 7, 'f1', 0, false),
  ('americas', 8, 'b5', 5, false),
  ('americas', 9, 'k2', -2, false),
  ('americas', 10, 'f3', 0, false);
insert into public.hotels (id, name, area) values
  ('h1', '{"en":"Lotte Hotel Seoul","ko":"롯데호텔 서울"}'::jsonb, 'myeongdong'),
  ('h2', '{"en":"Ibis Styles Myeongdong","ko":"이비스 스타일 명동"}'::jsonb, 'myeongdong'),
  ('h3', '{"en":"Four Seasons Hotel Seoul","ko":"포시즌스 호텔 서울"}'::jsonb, 'gwanghwamun'),
  ('h4', '{"en":"L7 Hongdae","ko":"L7 홍대"}'::jsonb, 'hongdae'),
  ('h5', '{"en":"Grand Hyatt Seoul","ko":"그랜드 하얏트 서울"}'::jsonb, 'itaewon'),
  ('h6', '{"en":"Josun Palace","ko":"조선 팰리스"}'::jsonb, 'gangnam'),
  ('h7', '{"en":"Signiel Seoul","ko":"시그니엘 서울"}'::jsonb, 'jamsil');
insert into public.orders (id, created_at, email, guest_name, hotel_id, room, delivery_date, slot, items_krw, service_fee_krw, delivery_fee_krw, total_krw, payment_method, status) values
  ('HS-1042', '2026-11-02T11:20:00+09:00', 'yuki@example.com', 'Yuki T.', 'h1', null, '2026-11-02', '18-21', 51000, 4000, 0, 55000, 'paypay', 'paid'),
  ('HS-1039', '2026-11-02T10:02:00+09:00', 'sarah@example.com', 'Sarah K.', 'h4', null, '2026-11-02', '15-18', 39600, 4000, 0, 43600, 'card', 'purchased'),
  ('HS-1035', '2026-11-02T09:15:00+09:00', 'emily@example.com', 'Emily R.', 'h5', null, '2026-11-02', '15-18', 24000, 4000, 0, 28000, 'card', 'delivering'),
  ('HS-1031', '2026-11-02T08:01:00+09:00', 'mei@example.com', 'Mei C.', 'h6', null, '2026-11-02', '12-15', 45000, 4000, 0, 49000, 'alipay', 'delivered');
insert into public.order_lines (order_id, product_id, qty, unit_price_krw) values
  ('HS-1042', 'b1', 1, 21000),
  ('HS-1042', 'b2', 2, 15000),
  ('HS-1039', 'k1', 2, 19800),
  ('HS-1035', 'b3', 1, 24000),
  ('HS-1031', 'b7', 1, 45000);
commit;
