// Database security tests. Needs psql and an empty Postgres 15+ database:
//   DATABASE_URL=postgres://postgres@localhost:5432/postgres npm run test:db
// Loads supabase/tests/stub.sql + supabase/setup.sql, then checks what each
// kind of visitor can and cannot do. Every case runs in its own rolled-back
// transaction.
import { execFileSync } from "node:child_process";

const db = process.env.DATABASE_URL;
if (!db) { console.error("Set DATABASE_URL (an empty test database; it will be wiped)."); process.exit(1); }
const psql = (args, input) => execFileSync("psql", [db, "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", ...args], { input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });

psql(["-f", "supabase/tests/stub.sql"]);
psql(["-f", "supabase/setup.sql"]);
psql([], `insert into public.staff (name, email, role, user_id) values
  ('Owner', 'owner@test.kr', 'owner', '11111111-1111-1111-1111-111111111111'),
  ('Manager', 'manager@test.kr', 'manager', '22222222-2222-2222-2222-222222222222'),
  ('Staff', 'staff@test.kr', 'staff', '33333333-3333-3333-3333-333333333333');`);

const who = {
  anon: ["anon", {}],
  guest: ["authenticated", { sub: "44444444-4444-4444-4444-444444444444", email: "guest@test.kr", aal: "aal2" }],
  ownerNoCode: ["authenticated", { sub: "11111111-1111-1111-1111-111111111111", email: "owner@test.kr", aal: "aal1" }],
  owner: ["authenticated", { sub: "11111111-1111-1111-1111-111111111111", email: "owner@test.kr", aal: "aal2" }],
  manager: ["authenticated", { sub: "22222222-2222-2222-2222-222222222222", email: "manager@test.kr", aal: "aal2" }],
  staff: ["authenticated", { sub: "33333333-3333-3333-3333-333333333333", email: "staff@test.kr", aal: "aal2" }],
  server: ["service_role", {}],
};

const tomorrow = "(now() at time zone 'Asia/Seoul')::date + 1";
const order = (extra = "") => `select public.create_order(jsonb_build_object('email','a@b.co','guest_name','Yuki','hotel_id','h1','room','','delivery_date',${tomorrow},'slot','18-21','payment_method','card','locale','ja','lines',jsonb_build_array(jsonb_build_object('product_id','b1','qty',2)))${extra})`;

// [who, sql, expected output or { err: "text in the error" }]
const cases = [
  // Shoppers
  ["anon", "select count(*) from products where not visible", "0"],
  ["anon", "select count(*) > 0 from products", "t"],
  ["anon", "select count(*) from orders", "0"],
  ["anon", "select count(*) from staff", "0"],
  ["anon", "update products set store_price_krw = 1 where id = 'b1' returning id", ""],
  ["anon", "select lookup_order('HS-1042', 'nobody@x.co') is null", "t"],
  ["anon", "select lookup_order('hs-1042', 'YUKI@example.com') ->> 'id'", "HS-1042"],
  ["anon", "select lookup_order('HS-1042', 'yuki@example.com') ? 'notified_status'", "f"],
  ["anon", `${order()} like 'HS-%'`, "t"],
  ["anon", order(" || jsonb_build_object('slot','09-12')"), { err: "invalid_slot" }],
  ["anon", order(" || jsonb_build_object('email','not-an-email')"), { err: "invalid_email" }],
  ["anon", order(" || jsonb_build_object('lines', jsonb_build_array(jsonb_build_object('product_id','f3','qty',1)))"), { err: "unavailable_item" }],
  ["anon", order(" || jsonb_build_object('lines', jsonb_build_array(jsonb_build_object('product_id','b1','qty',11)))"), { err: "invalid_qty" }],
  ["anon", order(" || jsonb_build_object('delivery_date', (now() at time zone 'Asia/Seoul')::date + 30)"), { err: "invalid_date" }],
  // NEW = place an order first; its number is in :'id'
  ["anon", "NEW select (select count(*) from orders), lookup_order(:'id', 'a@b.co') ->> 'total_krw'", "0|46000"],
  ["anon", "NEW select confirm_test_payment(:'id', 'a@b.co')", "paid"],
  ["anon", "NEW select confirm_test_payment(:'id', 'other@b.co')", { err: "not_pending" }],
  ["anon", "NEW select string_agg(k, ',' order by k) from jsonb_object_keys(lookup_order(:'id', 'a@b.co') -> 'events') k", "pending"],
  ["anon", "select claim_notification('HS-1042')", { err: "permission denied" }],
  ["anon", "select save_ranking('all', array['b1'])", { err: "permission denied" }],
  ["anon", "insert into storage.objects values ('product-images', 'x.jpg')", { err: "row-level security" }],
  ["anon", "update app_settings set service_fee_krw = 0 returning 1", ""],
  // Signed in but not staff, or staff without the authenticator step
  ["guest", "select count(*) from orders", "0"],
  ["guest", "select count(*) from staff_me()", "0"],
  ["ownerNoCode", "select count(*) from orders", "0"],
  ["ownerNoCode", "select count(*) from staff_list()", "0"],
  ["ownerNoCode", "insert into storage.objects values ('product-images', 'x.jpg')", { err: "row-level security" }],
  // Delivery staff
  ["staff", "select count(*) > 0 from orders", "t"],
  ["staff", "select role from staff_me()", "staff"],
  ["staff", "update orders set status = 'purchased' where id = 'HS-1042' returning status", "purchased"],
  ["staff", "update orders set total_krw = 1 where id = 'HS-1042'", { err: "permission denied" }],
  ["staff", "update products set visible = false where id = 'b1' returning id", ""],
  ["staff", "select save_ranking('all', array['b1'])", { err: "forbidden" }],
  ["staff", "insert into storage.objects values ('handover-photos', 'HS-1/a.jpg') returning name", "HS-1/a.jpg"],
  ["staff", "insert into storage.objects values ('product-images', 'x.jpg')", { err: "row-level security" }],
  ["staff", "select count(*) from staff_list()", "0"],
  ["staff", "update app_settings set service_fee_krw = 0 returning 1", ""],
  // Manager
  ["manager", "update products set visible = false where id = 'b1' returning id", "b1"],
  ["manager", "insert into storage.objects values ('product-images', 'b1/a.jpg') returning name", "b1/a.jpg"],
  ["manager", "select save_ranking('all', array['b3','b1']); select string_agg(product_id || ':' || change || ':' || is_new, ',' order by rank) from rankings where region = 'all'", "b3:2:false,b1:-1:false"],
  ["manager", "select save_ranking('all', array['b1','b1'])", { err: "duplicate_product" }],
  ["manager", "select save_ranking('all', array['nope'])", { err: "unknown_product" }],
  ["manager", "insert into staff (name, email, role) values ('X', 'x@test.kr', 'staff')", { err: "row-level security" }],
  ["manager", "update app_settings set service_fee_krw = 0 returning 1", ""],
  // Owner
  ["owner", "select count(*) from staff_list()", "3"],
  ["owner", "insert into staff (name, email, role) values ('X', 'x@test.kr', 'staff') returning email", "x@test.kr"],
  ["owner", "update app_settings set service_fee_krw = 3000 returning service_fee_krw", "3000"],
  ["owner", "update app_settings set cutoff_hour = 30", { err: "check constraint" }],
  // Server (secret key): emails are handed out once per status
  ["server", "select claim_notification('HS-1042') is null", "t"],
  ["server", "NEW update orders set status = 'paid' where id = :'id'; select x ->> 'locale', x ->> 'status' from (select claim_notification(:'id') x) s; select claim_notification(:'id') is null", "ja|paid\nt"],
];

let failed = 0;
for (const [name, sql, want] of cases) {
  const [role, claims] = who[name];
  let out, err;
  const body = sql.startsWith("NEW ") ? `${order()} as id \\gset\n${sql.slice(4)}` : sql;
  try {
    out = psql([], `begin; set local role ${role}; select set_config('request.jwt.claims', '${JSON.stringify(claims)}', true) \\g /dev/null\n${body};\nrollback;`).trim();
  } catch (e) { err = String(e.stderr || e.message); }
  const ok = typeof want === "string" ? err === undefined && out === want.trim() : err?.includes(want.err);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name.padEnd(11)} ${sql.replace(/\s+/g, " ").slice(0, 90)}${ok ? "" : `\n     expected ${JSON.stringify(want)}, got ${err ? `error: ${err.trim().split("\n")[0]}` : JSON.stringify(out)}`}`);
}
console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
