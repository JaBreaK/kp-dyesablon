import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pmfzypvynmyotmvbgafi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZnp5cHZ5bm15b3RtdmJnYWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxNTcxNTgsImV4cCI6MjA2MTczMzE1OH0.NimEhbTS9Rz_GGXpEABU_rWunPB6TUN7S4ufTS7FNiM' // ambil dari Supabase -> Project -> API -> anon key

export const supabase = createClient(supabaseUrl, supabaseKey)
