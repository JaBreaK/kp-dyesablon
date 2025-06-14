// supabase.ts
import { createClient } from '@supabase/supabase-js'

// Baca dari env. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_KEY sudah di-define di .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // Opsional: throw error saat env belum di-set, supaya tidak sulit debugging
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
