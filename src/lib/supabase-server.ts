import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// PROD credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// PREPROD credentials
const supabaseUrlPreprod = process.env.NEXT_PUBLIC_SUPABASE_URL_PREPROD!;
const supabaseServiceKeyPreprod = process.env.SUPABASE_SERVICE_ROLE_KEY_PREPROD!;

function makeClient(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase server credentials not configured');
  }
  return makeClient(supabaseUrl, supabaseServiceKey);
}

export function getSupabasePreprodClient() {
  if (!supabaseUrlPreprod || !supabaseServiceKeyPreprod) {
    throw new Error('Supabase PREPROD credentials not configured');
  }
  return makeClient(supabaseUrlPreprod, supabaseServiceKeyPreprod);
}

export function isSupabaseServerConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey);
}

export function isSupabasePreprodConfigured(): boolean {
  const isPlaceholder = (val: string) =>
    !val || val.startsWith('REEMPLAZAR') || val === '';
  return !isPlaceholder(supabaseUrlPreprod) && !isPlaceholder(supabaseServiceKeyPreprod);
}
