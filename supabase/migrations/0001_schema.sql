-- ISM Digital Museum: өгөгдлийн сангийн бүтэц, эрхийн хамгаалалт (RLS), Storage.
-- Supabase SQL Editor дээр эхнээс нь дуустал нэг удаа ажиллуулна.

-- ---------------------------------------------------------------------------
-- 1. Хүснэгтүүд
-- ---------------------------------------------------------------------------

-- Хэрэглэгчийн профайл. auth.users-тэй 1:1 холбоотой (PK нь FK).
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url   text,
  bio          text check (char_length(bio) <= 1000),
  role         text not null default 'creator' check (role in ('creator', 'admin')),
  created_at   timestamptz not null default now()
);

-- Үзмэрийн ангилал.
create table public.exhibition_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 1 and 60),
  description text
);

-- Музейн үзмэр / оюутны бүтээл.
-- creator_id -> profiles.id : нэг бүтээгч олон үзмэртэй (1:N).
-- category_id -> exhibition_categories.id : ангилал устахад үзмэр үлдэнэ.
create table public.exhibits (
  id               uuid primary key default gen_random_uuid(),
  catalog_no       bigint generated always as identity,
  title            text not null check (char_length(title) between 1 and 120),
  description      text not null check (char_length(description) between 1 and 5000),
  image_url        text check (image_url ~* '^(https?://|/seed/)'),
  category_id      uuid references public.exhibition_categories (id) on delete set null,
  technology_stack text[] not null default '{}',
  year_created     integer not null check (year_created between 1990 and 2100),
  creator_id       uuid not null references public.profiles (id) on delete cascade,
  demo_url         text check (demo_url ~* '^https?://'),
  github_url       text check (github_url ~* '^https?://'),
  status           text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index exhibits_status_year_idx on public.exhibits (status, year_created desc);
create index exhibits_creator_idx on public.exhibits (creator_id);
create index exhibits_category_idx on public.exhibits (category_id);

-- Тэнхимийн багш нар.
create table public.teachers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  position   text not null,
  courses    text[] not null default '{}',
  bio        text,
  photo_url  text,
  created_at timestamptz not null default now()
);

-- Тэнхимийн өдөрлөг, арга хэмжээ.
create table public.events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null check (char_length(title) between 1 and 160),
  event_date      date not null,
  description     text,
  cover_image_url text,
  created_at      timestamptz not null default now()
);
create index events_date_idx on public.events (event_date desc);

-- Арга хэмжээний зурагт цомог. event_id -> events.id (1:N), арга хэмжээ устахад зураг устана.
create table public.event_photos (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  image_url  text not null,
  caption    text,
  created_at timestamptz not null default now()
);
create index event_photos_event_idx on public.event_photos (event_id);

-- Тэнхимийн түүхийн үе шат (жишиг бүтцийг өргөтгөсөн хүснэгт).
create table public.history_milestones (
  id          uuid primary key default gen_random_uuid(),
  year        integer not null check (year between 1900 and 2100),
  title       text not null check (char_length(title) between 1 and 160),
  description text,
  created_at  timestamptz not null default now()
);
create index history_milestones_year_idx on public.history_milestones (year);

-- ---------------------------------------------------------------------------
-- 2. Функц, триггер
-- ---------------------------------------------------------------------------

-- Одоогийн хэрэглэгч админ эсэх. SECURITY DEFINER нь profiles-ийн RLS дээр
-- дахин давтагдах (infinite recursion) алдаанаас хамгаална.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Шинэ хэрэглэгч бүртгүүлэхэд профайлыг автоматаар үүсгэнэ.
-- Имэйл нийтэд ил гарахгүйн тулд нэрийг имэйлээс гаргаж авахгүй.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Шинэ бүтээгч')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Админ биш хэрэглэгч:
--   * үзмэрээ өөрөө нийтэлж чадахгүй: нэмсэн, зассан бүтээл хяналтад очно;
--   * үзмэрийн эзэмшигчийг сольж чадахгүй.
-- auth.uid() хоосон үед (SQL Editor, seed) шууд зөвшөөрнө.
create function public.exhibits_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.status := 'pending';
  if tg_op = 'UPDATE' then
    new.creator_id := old.creator_id;
  end if;
  return new;
end;
$$;

create trigger exhibits_guard_trigger
  before insert or update on public.exhibits
  for each row execute function public.exhibits_guard();

-- ---------------------------------------------------------------------------
-- 3. Хүснэгтийн эрх
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on public.exhibits, public.teachers, public.events,
  public.event_photos, public.history_milestones, public.exhibition_categories
  to authenticated;

-- Хэрэглэгч `role` баганыг API-аар өөрчилж өөрийгөө админ болгож чадахгүй:
-- UPDATE эрхийг зөвхөн эдгээр баганад олгоно.
grant update (display_name, avatar_url, bio) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles              enable row level security;
alter table public.exhibition_categories enable row level security;
alter table public.exhibits              enable row level security;
alter table public.teachers              enable row level security;
alter table public.events                enable row level security;
alter table public.event_photos          enable row level security;
alter table public.history_milestones    enable row level security;

-- profiles: бүгд харна, зөвхөн өөрийнхөө профайлыг засна.
create policy profiles_select on public.profiles
  for select to anon, authenticated using (true);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- exhibits: нийтлэгдсэнийг бүгд, бусдыг нь эзэмшигч болон админ харна.
create policy exhibits_select on public.exhibits
  for select to anon, authenticated
  using (status = 'published' or creator_id = auth.uid() or public.is_admin());
create policy exhibits_insert on public.exhibits
  for insert to authenticated
  with check (creator_id = auth.uid() or public.is_admin());
create policy exhibits_update on public.exhibits
  for update to authenticated
  using (creator_id = auth.uid() or public.is_admin())
  with check (creator_id = auth.uid() or public.is_admin());
create policy exhibits_delete on public.exhibits
  for delete to authenticated
  using (creator_id = auth.uid() or public.is_admin());

-- Тэнхимийн агуулга: бүгд харна, зөвхөн админ өөрчилнө.
create policy categories_select on public.exhibition_categories
  for select to anon, authenticated using (true);
create policy categories_admin on public.exhibition_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy teachers_select on public.teachers
  for select to anon, authenticated using (true);
create policy teachers_admin on public.teachers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy events_select on public.events
  for select to anon, authenticated using (true);
create policy events_admin on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy event_photos_select on public.event_photos
  for select to anon, authenticated using (true);
create policy event_photos_admin on public.event_photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy history_select on public.history_milestones
  for select to anon, authenticated using (true);
create policy history_admin on public.history_milestones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Storage: зураг хадгалах `media` bucket
-- ---------------------------------------------------------------------------
-- Файл бүр `<хэрэглэгчийн id>/<файлын нэр>` замтай. 5 MB хүртэл, зөвхөн растер зураг
-- (SVG-ээр дамжих XSS-ээс хамгаалж svg-г зөвшөөрөхгүй).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Нийтийн bucket-ийн файлыг URL-аар уншихад SELECT бодлого хэрэггүй. Энэ бодлого нь зөвхөн
-- файл устгах үйлдэлд хэрэгтэй тул зочин файлын жагсаалт авах боломжгүй.
create policy media_select on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy media_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy media_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
