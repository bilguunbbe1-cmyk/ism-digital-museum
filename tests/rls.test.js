// RLS-ийн бодит тест: миграцийг локал Postgres (PGlite) дээр ажиллуулж,
// зочин, бүтээгч, админ тус бүрийн эрхээр хандаж шалгана.
// Supabase-ийн auth, storage схемийг доорх stub орлоно.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const ALICE = '00000000-0000-4000-8000-00000000000a';
const BOB = '00000000-0000-4000-8000-00000000000b';
const ADMIN = '00000000-0000-4000-8000-00000000000c';

const db = new PGlite();

const STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create schema storage;
  grant usage on schema storage to anon, authenticated;
  create table storage.buckets (id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id serial primary key, bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant all on storage.objects to anon, authenticated;
  grant usage on all sequences in schema storage to authenticated;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
`;

async function as(role, uid, fn) {
  await db.exec(`reset role; select set_config('test.uid', '${uid ?? ''}', false); set role ${role};`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('test.uid', '', false);`);
  }
}
const guest = (fn) => as('anon', null, fn);
const user = (uid, fn) => as('authenticated', uid, fn);

async function denied(fn) {
  await assert.rejects(fn, /permission denied|row-level security/);
}

let aliceExhibit;
let bobExhibit;

before(async () => {
  await db.exec(STUB);
  await db.exec(readFileSync(new URL('../supabase/migrations/0001_schema.sql', import.meta.url), 'utf8'));
  await db.exec(`
    insert into auth.users (id, raw_user_meta_data) values
      ('${ALICE}', '{"display_name":"Alice"}'), ('${BOB}', '{}'), ('${ADMIN}', '{}');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
  `);
  const a = await db.query(
    `insert into exhibits (title, description, year_created, creator_id, status)
     values ('A', 'd', 2024, '${ALICE}', 'published') returning id`);
  const b = await db.query(
    `insert into exhibits (title, description, year_created, creator_id, status)
     values ('B', 'd', 2024, '${BOB}', 'pending') returning id`);
  aliceExhibit = a.rows[0].id;
  bobExhibit = b.rows[0].id;
});

test('бүртгүүлэхэд профайл автоматаар үүснэ', async () => {
  const { rows } = await db.query(`select display_name, role from profiles where id = '${ALICE}'`);
  assert.deepEqual(rows[0], { display_name: 'Alice', role: 'creator' });
});

test('зочин зөвхөн нийтлэгдсэн үзмэрийг харна', async () => {
  const { rows } = await guest(() => db.query('select title from exhibits'));
  assert.deepEqual(rows.map((r) => r.title), ['A']);
});

test('зочин юу ч бичиж чадахгүй', async () => {
  await guest(async () => {
    await denied(() => db.query(`insert into teachers (name, position) values ('x', 'y')`));
    await denied(() => db.query(`insert into exhibits (title, description, year_created, creator_id)
      values ('x', 'y', 2024, '${ALICE}')`));
    await denied(() => db.query(`delete from exhibits`));
  });
});

test('бүтээгч бусдын нийтлэгдээгүй үзмэрийг харахгүй, өөрийнхийгөө харна', async () => {
  const seenByAlice = await user(ALICE, () => db.query('select title from exhibits'));
  assert.deepEqual(seenByAlice.rows.map((r) => r.title), ['A']);
  const seenByBob = await user(BOB, () => db.query('select title from exhibits order by title'));
  assert.deepEqual(seenByBob.rows.map((r) => r.title), ['A', 'B']);
});

test('бүтээгч бусдын үзмэрийг засаж, устгаж чадахгүй', async () => {
  await user(BOB, async () => {
    const upd = await db.query(`update exhibits set title = 'hacked' where id = '${aliceExhibit}'`);
    assert.equal(upd.affectedRows, 0);
    const del = await db.query(`delete from exhibits where id = '${aliceExhibit}'`);
    assert.equal(del.affectedRows, 0);
  });
  const { rows } = await db.query(`select title from exhibits where id = '${aliceExhibit}'`);
  assert.equal(rows[0].title, 'A');
});

test('бусдын нэрээр үзмэр нэмж чадахгүй', async () => {
  await user(BOB, () => denied(() => db.query(`insert into exhibits (title, description, year_created, creator_id)
    values ('x', 'y', 2024, '${ALICE}')`)));
});

test('бүтээгч үзмэрээ өөрөө нийтэлж чадахгүй', async () => {
  await user(BOB, async () => {
    const ins = await db.query(`insert into exhibits (title, description, year_created, creator_id, status)
      values ('self', 'y', 2024, '${BOB}', 'published') returning status`);
    assert.equal(ins.rows[0].status, 'pending');
    const upd = await db.query(`update exhibits set status = 'published' where id = '${bobExhibit}' returning status`);
    assert.equal(upd.rows[0].status, 'pending');
  });
});

test('нийтлэгдсэн үзмэрийг засахад дахин хяналтад орж, эзэмшигч солигдохгүй', async () => {
  const id = (await db.query(`insert into exhibits (title, description, year_created, creator_id, status)
    values ('pub', 'y', 2024, '${BOB}', 'published') returning id`)).rows[0].id;
  const { rows } = await user(BOB, () => db.query(
    `update exhibits set title = 'pub2', creator_id = '${ALICE}' where id = '${id}' returning status, creator_id`));
  assert.equal(rows[0].status, 'pending');
  assert.equal(rows[0].creator_id, BOB);
});

test('хэрэглэгч өөрийгөө админ болгож чадахгүй', async () => {
  await user(ALICE, () => denied(() => db.query(`update profiles set role = 'admin' where id = '${ALICE}'`)));
});

test('хэрэглэгч бусдын профайлыг засаж чадахгүй, өөрийнхийгөө засна', async () => {
  await user(ALICE, async () => {
    const other = await db.query(`update profiles set display_name = 'x' where id = '${BOB}'`);
    assert.equal(other.affectedRows, 0);
    const own = await db.query(`update profiles set bio = 'сайн уу' where id = '${ALICE}'`);
    assert.equal(own.affectedRows, 1);
  });
});

test('энгийн хэрэглэгч тэнхимийн агуулгыг өөрчилж чадахгүй', async () => {
  await user(ALICE, async () => {
    await denied(() => db.query(`insert into teachers (name, position) values ('x', 'y')`));
    await denied(() => db.query(`insert into events (title, event_date) values ('x', '2024-01-01')`));
    await denied(() => db.query(`insert into history_milestones (year, title) values (2024, 'x')`));
    await denied(() => db.query(`insert into exhibition_categories (name) values ('x')`));
  });
});

test('админ агуулга нэмж, үзмэр нийтэлж чадна', async () => {
  await user(ADMIN, async () => {
    const t = await db.query(`insert into teachers (name, position) values ('Багш', 'Ахлах') returning id`);
    assert.ok(t.rows[0].id);
    const upd = await db.query(`update exhibits set status = 'published' where id = '${bobExhibit}' returning status`);
    assert.equal(upd.rows[0].status, 'published');
  });
});

test('javascript: холбоосыг өгөгдлийн сан хүлээж авахгүй', async () => {
  await user(ALICE, () => assert.rejects(() => db.query(
    `insert into exhibits (title, description, year_created, creator_id, demo_url)
     values ('x', 'y', 2024, '${ALICE}', 'javascript:alert(1)')`), /check constraint/));
});

test('зургийг зөвхөн өөрийн хавтаст оруулна, бусдын файлыг устгахгүй', async () => {
  await user(ALICE, () => db.query(`insert into storage.objects (bucket_id, name) values ('media', '${ALICE}/a.png')`));
  await user(BOB, async () => {
    await denied(() => db.query(`insert into storage.objects (bucket_id, name) values ('media', '${ALICE}/evil.png')`));
    const del = await db.query(`delete from storage.objects where name = '${ALICE}/a.png'`);
    assert.equal(del.affectedRows, 0);
  });
  const del = await user(ALICE, () => db.query(`delete from storage.objects where name = '${ALICE}/a.png'`));
  assert.equal(del.affectedRows, 1);
});
