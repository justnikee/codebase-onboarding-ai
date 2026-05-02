/**
 * Supabase client – uses service role key so it bypasses RLS.
 * Only used server-side in Express routes/services.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _client: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  _client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
} else {
  console.warn(
    "⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set – " +
      "database features disabled. Add them to .env to enable persistence.",
  );
}

export const supabase = _client;
export const isDbEnabled = (): boolean => _client !== null;
