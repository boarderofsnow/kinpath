import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Anon client — used with a user's JWT to respect RLS policies.
 * Pass the user's access token via createUserSupabaseClient() for authenticated queries.
 */
export function createServerSupabaseClient() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * User-scoped anon client — passes the user's JWT in the Authorization header
 * so all queries run under that user's identity and respect RLS.
 */
export function createUserSupabaseClient(accessToken: string) {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_ANON_KEY"),
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

/**
 * Service role client — bypasses RLS entirely.
 * Use only for admin operations (account deletion, household linking, etc.)
 */
export function createServiceRoleClient() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
