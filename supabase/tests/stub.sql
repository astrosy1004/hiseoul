-- Minimal stand-in for the parts of Supabase that schema.sql relies on, so the
-- security rules can be tested on a plain Postgres (used by npm run test:db and CI).
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
alter role service_role bypassrls;

drop schema if exists auth cascade;
drop schema if exists storage cascade;
drop schema if exists public cascade;
create schema public;
create schema auth;
create schema storage;

create function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
create table auth.users (id uuid primary key, email text);
create table auth.mfa_factors (id uuid primary key default gen_random_uuid(), user_id uuid, status text);

create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (bucket_id text, name text);
alter table storage.objects enable row level security;
create policy objects_read on storage.objects for select using (true);

grant usage on schema public, auth, storage to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
grant all on storage.objects to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

insert into auth.users values
  ('11111111-1111-1111-1111-111111111111', 'owner@test.kr'),
  ('22222222-2222-2222-2222-222222222222', 'manager@test.kr'),
  ('33333333-3333-3333-3333-333333333333', 'staff@test.kr'),
  ('44444444-4444-4444-4444-444444444444', 'guest@test.kr');
