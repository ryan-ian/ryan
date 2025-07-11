import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// These environment variables need to be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Create a client that bypasses RLS for server-side operations
// Note: In a production app, you should only use this on the server side
// and protect it with proper authentication checks
// This is just for demonstration purposes
export const createAdminClient = () => {
  // In a real app, you would use a service role key that's only available server-side
  // For this demo, we'll use the same anon key but note this is NOT secure
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
} 