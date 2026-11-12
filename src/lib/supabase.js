import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// The anon key is designed to be public; Row Level Security (supabase/schema.sql) is what protects data.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
