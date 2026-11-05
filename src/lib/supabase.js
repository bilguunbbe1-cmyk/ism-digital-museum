import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Зөвхөн нийтийн (anon) түлхүүр ашиглана. Хамгаалалтыг өгөгдлийн сангийн RLS хариуцна.
export const isConfigured = Boolean(url && anonKey);
export const supabase = isConfigured ? createClient(url, anonKey) : null;
