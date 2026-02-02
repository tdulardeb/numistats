import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Service Role Key - SOLO para uso en el servidor (API routes)
// NUNCA uses NEXT_PUBLIC_ para esta key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente del servidor con Service Role (bypasea RLS)
export function getSupabaseServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase server credentials not configured');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Verificar si el servidor está configurado
export function isSupabaseServerConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey);
}
