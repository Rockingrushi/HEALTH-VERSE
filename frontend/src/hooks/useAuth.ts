import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local mock user first
    const mockUserStr = localStorage.getItem("healthverse_demo_user");
    if (mockUserStr) {
      try {
        const parsedUser = JSON.parse(mockUserStr);
        setUser(parsedUser as User);
        setSession({ access_token: "demo-token", user: parsedUser } as unknown as Session);
        setLoading(false);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          localStorage.setItem("supabase.auth.token", session.access_token);
        }
        setLoading(false);
      }).catch(() => setLoading(false));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          localStorage.setItem("supabase.auth.token", session.access_token);
        } else if (!localStorage.getItem("healthverse_demo_user")) {
          localStorage.removeItem("supabase.auth.token");
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    localStorage.removeItem("healthverse_demo_user");
    localStorage.removeItem("supabase.auth.token");
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
  };

  return { session, user, loading, signOut };
}
