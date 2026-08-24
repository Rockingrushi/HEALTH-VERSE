import os

files = {
    'src/lib/api.ts': '''import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("supabase.auth.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
''',

    'src/lib/supabase.ts': '''import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
''',

    'src/hooks/useAuth.ts': '''import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
          localStorage.setItem("supabase.auth.token", session.access_token);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
          localStorage.setItem("supabase.auth.token", session.access_token);
      } else {
          localStorage.removeItem("supabase.auth.token");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user, loading, signOut: () => supabase.auth.signOut() };
}
'''
}

for filepath, content in files.items():
    full_path = os.path.join('frontend', filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Services created.")
