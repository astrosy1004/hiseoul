-- Register the first owner (대표) account.
-- 1) Supabase > Authentication > Users > "Add user" with your email + password
--    (tick "Auto Confirm User").
-- 2) Replace the email below with that same email, then run this file.
insert into public.staff (name, email, role)
values ('김수연', lower('YOUR-EMAIL@example.com'), 'owner')
on conflict (email) do update set role = 'owner', active = true;
