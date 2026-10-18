import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes('placeholder.supabase.co') &&
    Boolean(supabaseAnonKey) &&
    supabaseAnonKey !== 'placeholder-anon-key' &&
    supabaseAnonKey !== 'your-anon-public-key-here' &&
    (supabaseAnonKey.startsWith('ey') || supabaseAnonKey.startsWith('sb_') || supabaseAnonKey.length > 20)
  );
};

/**
 * Authoritative Supabase Client for AMIEE Recruitment Engine
 * Handles standard OAuth/Password session persistence in browser session storage,
 * and passes authenticated JWT tokens automatically to PostgreSQL RLS policies.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
