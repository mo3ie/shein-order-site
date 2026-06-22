import { supabase } from "@/lib/supabaseClient";

/**
 * fetch() wrapper that attaches the logged-in user's Supabase access token as a
 * Bearer header. Admin/staff API routes (e.g. GET/PUT /api/order) require it.
 */
export async function adminFetch(url, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers = { ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...opts, headers });
}
