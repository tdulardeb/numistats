import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Usar variables de entorno públicas (ANON KEY, nunca Service Role en el frontend)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Helper para verificar si Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// Cliente de Supabase - solo se crea si está configurado
let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      supabaseUrl!,
      supabaseAnonKey!,
      {
        auth: {
          persistSession: false,
        },
      }
    );
  }
  
  return supabaseClient;
}

// Export para compatibilidad - puede ser null si no está configurado
export const supabase = isSupabaseConfigured() 
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, { auth: { persistSession: false } })
  : null;
