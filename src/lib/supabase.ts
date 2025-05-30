// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Ambil dari env
const supabaseUrl  = import.meta.env.PUBLIC_SUPABASE_URL as string;
const supabaseKey  = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
