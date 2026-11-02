// Supabase client for the browser. Reads the public project URL and the
// publishable (anon) key from .env.local. Without them the app keeps running
// on the sample data in mock-data.ts.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const usingSupabase = supabase !== null;
