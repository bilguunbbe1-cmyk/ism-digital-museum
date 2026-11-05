import { supabase } from './supabase.js';

const BUCKET = 'media';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const EXHIBIT_SELECT =
  '*, category:exhibition_categories(id, name), creator:profiles(id, display_name, avatar_url)';

// Supabase-ийн хариуг задалж, алдаа гарвал throw хийнэ.
async function unwrap(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/* Үзмэр */
export const fetchPublishedExhibits = () =>
  unwrap(
    supabase
      .from('exhibits')
      .select(EXHIBIT_SELECT)
      .eq('status', 'published')
      .order('year_created', { ascending: false })
      .order('catalog_no', { ascending: false }),
  );

export const fetchExhibit = (id) =>
  unwrap(supabase.from('exhibits').select(EXHIBIT_SELECT).eq('id', id).maybeSingle());

export const fetchExhibitsByCreator = (userId) =>
  unwrap(
    supabase
      .from('exhibits')
      .select(EXHIBIT_SELECT)
      .eq('creator_id', userId)
      .order('updated_at', { ascending: false }),
  );

export const fetchAllExhibits = () =>
  unwrap(supabase.from('exhibits').select(EXHIBIT_SELECT).order('updated_at', { ascending: false }));

export const createExhibit = (values) =>
  unwrap(supabase.from('exhibits').insert(values).select().single());

export const updateExhibit = (id, values) =>
  unwrap(supabase.from('exhibits').update(values).eq('id', id).select().single());

export async function deleteExhibit(exhibit) {
  await unwrap(supabase.from('exhibits').delete().eq('id', exhibit.id));
  await removeStoredImage(exhibit.image_url);
}

/* Профайл */
export const fetchProfile = (id) =>
  unwrap(supabase.from('profiles').select('*').eq('id', id).maybeSingle());

export const updateProfile = (id, values) =>
  unwrap(supabase.from('profiles').update(values).eq('id', id).select().single());

// Нийтлэгдсэн бүтээлтэй оюутнууд.
export const fetchCreators = () =>
  unwrap(
    supabase
      .from('profiles')
      .select('id, display_name, avatar_url, bio, exhibits!inner(id, title, year_created, status)')
      .eq('exhibits.status', 'published')
      .order('display_name'),
  );

/* Тэнхимийн агуулга */
export const fetchCategories = () =>
  unwrap(supabase.from('exhibition_categories').select('*').order('name'));
export const fetchTeachers = () =>
  unwrap(supabase.from('teachers').select('*').order('created_at'));
export const fetchEvents = () =>
  unwrap(supabase.from('events').select('*').order('event_date', { ascending: false }));
export const fetchEvent = (id) =>
  unwrap(
    supabase
      .from('events')
      .select('*, photos:event_photos(*)')
      .eq('id', id)
      .order('created_at', { referencedTable: 'event_photos' })
      .maybeSingle(),
  );
export const fetchMilestones = () =>
  unwrap(supabase.from('history_milestones').select('*').order('year'));

// Админ хэсгийн ерөнхий хадгалах, устгах үйлдэл.
export function saveRow(table, id, values) {
  const query = id ? supabase.from(table).update(values).eq('id', id) : supabase.from(table).insert(values);
  return unwrap(query.select().single());
}
export const deleteRow = (table, id) => unwrap(supabase.from(table).delete().eq('id', id));

export const fetchEventPhotos = (eventId) =>
  unwrap(supabase.from('event_photos').select('*').eq('event_id', eventId).order('created_at'));

/* Зураг */
export function validateImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) return 'Зөвхөн JPG, PNG, WEBP, GIF зураг оруулна уу.';
  if (file.size > MAX_IMAGE_BYTES) return 'Зургийн хэмжээ 5 MB-аас хэтрэхгүй байх ёстой.';
  return null;
}

// Файлыг хэрэглэгчийн өөрийн хавтаст хадгална. RLS зөвхөн энэ замыг зөвшөөрдөг.
export async function uploadImage(file, userId) {
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'img';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  await unwrap(supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type }));
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Хэрэглэхээ больсон файлыг цэвэрлэнэ. Амжилтгүй болсон ч үндсэн үйлдлийг саатуулахгүй.
export async function removeStoredImage(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  if (!url || !url.includes(marker)) return;
  const path = decodeURIComponent(url.split(marker)[1]);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn('Зураг устгаж чадсангүй:', error.message);
}

/* Нүүр хуудасны тоо */
export async function fetchStats() {
  const count = async (table, filter) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    const { count: n, error } = await q;
    if (error) throw error;
    return n;
  };
  const [exhibits, teachers, events] = await Promise.all([
    count('exhibits', ['status', 'published']),
    count('teachers'),
    count('events'),
  ]);
  return { exhibits, teachers, events };
}

// Supabase-ийн алдааг хэрэглэгчид ойлгомжтой болгоно.
export function friendlyError(err) {
  const msg = err?.message || '';
  if (/invalid login credentials/i.test(msg)) return 'Имэйл эсвэл нууц үг буруу байна.';
  if (/already registered/i.test(msg)) return 'Энэ имэйлээр бүртгэл үүссэн байна.';
  if (/email not confirmed/i.test(msg)) return 'Имэйл хаягаа баталгаажуулсны дараа нэвтэрнэ үү.';
  if (/rate limit/i.test(msg)) return 'Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.';
  if (/row-level security|permission denied/i.test(msg)) return 'Танд энэ үйлдлийг хийх эрх алга.';
  if (/failed to fetch|network/i.test(msg)) return 'Сүлжээний алдаа гарлаа. Холболтоо шалгана уу.';
  if (/duplicate key/i.test(msg)) return 'Ийм нэртэй бичлэг аль хэдийн байна.';
  return msg || 'Алдаа гарлаа. Дахин оролдоно уу.';
}
