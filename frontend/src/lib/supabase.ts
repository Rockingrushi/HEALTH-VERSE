import { createClient } from "@supabase/supabase-js";

const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://udgamlyajykoewvhdlcj.supabase.co";

const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "esb_publishable_wrq89eq-1ZY8O8Cw6bPgvg_S2fAdSOM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
