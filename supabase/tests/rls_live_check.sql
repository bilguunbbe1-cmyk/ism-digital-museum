-- Бодит Supabase төсөл дээр RLS-ийг шалгах скрипт. SQL Editor дээр ажиллуулна.
-- Шалгалтын бүх өөрчлөлтийг төгсгөлд нь буцаадаг тул өгөгдөлд нөлөөлөхгүй.
-- Үр дүн: мөр бүрийн ok багана true байх ёстой.
-- seed.sql-ийн жишээ хэрэглэгчдийг ашиглана.

do $$
declare
  alice uuid := 'a0000000-0000-4000-8000-000000000001';
  bob   uuid := 'a0000000-0000-4000-8000-000000000002';
  alice_exhibit uuid;
  bob_pending uuid;
  own_exhibit uuid;
  n int;
  val text;
  results jsonb := '[]';
begin
  begin
    select id into alice_exhibit from public.exhibits where creator_id = alice limit 1;
    insert into public.exhibits (title, description, year_created, creator_id, status)
      values ('RLS test', 'x', 2026, bob, 'pending') returning id into bob_pending;

    -- Зочин
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
    select count(*) into n from public.exhibits where id = bob_pending;
    results := results || jsonb_build_object('name', 'зочин нийтлэгдээгүй үзмэрийг харахгүй', 'ok', n = 0);
    begin
      insert into public.teachers (name, position) values ('x', 'y');
      results := results || jsonb_build_object('name', 'зочин багш нэмж чадахгүй', 'ok', false);
    exception when others then
      results := results || jsonb_build_object('name', 'зочин багш нэмж чадахгүй', 'ok', true);
    end;
    begin
      delete from public.exhibits where id = alice_exhibit;
      get diagnostics n = row_count;
      results := results || jsonb_build_object('name', 'зочин үзмэр устгаж чадахгүй', 'ok', n = 0);
    exception when others then
      results := results || jsonb_build_object('name', 'зочин үзмэр устгаж чадахгүй', 'ok', true);
    end;
    reset role;

    -- Бүтээгч Боб
    perform set_config('request.jwt.claims', jsonb_build_object('sub', bob, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.exhibits set title = 'hacked' where id = alice_exhibit;
    get diagnostics n = row_count;
    results := results || jsonb_build_object('name', 'бусдын үзмэрийг засаж чадахгүй', 'ok', n = 0);
    delete from public.exhibits where id = alice_exhibit;
    get diagnostics n = row_count;
    results := results || jsonb_build_object('name', 'бусдын үзмэрийг устгаж чадахгүй', 'ok', n = 0);
    update public.exhibits set status = 'published' where id = bob_pending returning status into val;
    results := results || jsonb_build_object('name', 'үзмэрээ өөрөө нийтэлж чадахгүй', 'ok', val = 'pending');
    begin
      insert into public.exhibits (title, description, year_created, creator_id)
        values ('x', 'y', 2026, alice);
      results := results || jsonb_build_object('name', 'бусдын нэрээр үзмэр нэмж чадахгүй', 'ok', false);
    exception when others then
      results := results || jsonb_build_object('name', 'бусдын нэрээр үзмэр нэмж чадахгүй', 'ok', true);
    end;
    begin
      update public.profiles set role = 'admin' where id = bob;
      results := results || jsonb_build_object('name', 'өөрийгөө админ болгож чадахгүй', 'ok', false);
    exception when others then
      results := results || jsonb_build_object('name', 'өөрийгөө админ болгож чадахгүй', 'ok', true);
    end;
    update public.profiles set bio = 'hacked' where id = alice;
    get diagnostics n = row_count;
    results := results || jsonb_build_object('name', 'бусдын профайлыг засаж чадахгүй', 'ok', n = 0);
    begin
      insert into public.events (title, event_date) values ('x', '2026-01-01');
      results := results || jsonb_build_object('name', 'тэнхимийн агуулгыг өөрчилж чадахгүй', 'ok', false);
    exception when others then
      results := results || jsonb_build_object('name', 'тэнхимийн агуулгыг өөрчилж чадахгүй', 'ok', true);
    end;
    begin
      insert into storage.objects (bucket_id, name, owner_id)
        values ('media', alice || '/evil.png', bob::text);
      results := results || jsonb_build_object('name', 'бусдын хавтаст файл оруулж чадахгүй', 'ok', false);
    exception when others then
      results := results || jsonb_build_object('name', 'бусдын хавтаст файл оруулж чадахгүй', 'ok', true);
    end;

    -- Бүтээгч өөрийн өгөгдлөө удирдаж чадна
    update public.exhibits set title = 'RLS test 2' where id = bob_pending;
    get diagnostics n = row_count;
    results := results || jsonb_build_object('name', 'өөрийн үзмэрийг засна', 'ok', n = 1);
    insert into public.exhibits (title, description, year_created, creator_id, status)
      values ('RLS own', 'x', 2026, bob, 'published') returning id, status into own_exhibit, val;
    results := results || jsonb_build_object('name', 'өөрийн үзмэр нэмэхэд хяналтад орно', 'ok', val = 'pending');
    delete from public.exhibits where id = own_exhibit;
    get diagnostics n = row_count;
    results := results || jsonb_build_object('name', 'өөрийн үзмэрийг устгана', 'ok', n = 1);
    update public.profiles set bio = 'x', display_name = 'Боб' where id = bob;
    get diagnostics n = row_count;
    results := results || jsonb_build_object('name', 'өөрийн профайлыг засна', 'ok', n = 1);
    begin
      insert into storage.objects (bucket_id, name, owner_id)
        values ('media', bob || '/ok.png', bob::text);
      results := results || jsonb_build_object('name', 'өөрийн хавтаст файл оруулна', 'ok', true);
    exception when others then
      results := results || jsonb_build_object('name', 'өөрийн хавтаст файл оруулна', 'ok', false, 'detail', sqlerrm);
    end;
    reset role;

    -- Админ (зөвхөн энэ шалгалтын хугацаанд)
    update public.profiles set role = 'admin' where id = bob;
    set local role authenticated;
    update public.exhibits set status = 'published' where id = bob_pending returning status into val;
    results := results || jsonb_build_object('name', 'админ үзмэр нийтэлнэ', 'ok', val = 'published');
    update public.exhibits set title = title where id = alice_exhibit;
    get diagnostics n = row_count;
    results := results || jsonb_build_object('name', 'админ бусдын үзмэрийг хянана', 'ok', n = 1);
    insert into public.teachers (name, position) values ('x', 'y') returning id into own_exhibit;
    delete from public.teachers where id = own_exhibit;
    get diagnostics n = row_count;
    results := results || jsonb_build_object('name', 'админ тэнхимийн агуулгыг удирдана', 'ok', n = 1);
    reset role;

    -- Бодлого идэвхтэй эсэх
    select count(*) into n from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
      where ns.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
    results := results || jsonb_build_object('name', 'public-ийн бүх хүснэгтэд RLS идэвхтэй', 'ok', n = 0);

    perform set_config('test.results', results::text, false);
    raise exception 'rollback_tests';
  exception when others then
    if sqlerrm <> 'rollback_tests' then raise; end if;
  end;
  perform set_config('test.results', results::text, false);
end $$;

select * from jsonb_to_recordset(current_setting('test.results')::jsonb) as t(name text, ok boolean, detail text);
