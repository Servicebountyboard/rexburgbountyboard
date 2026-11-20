import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigurationError } from "../../lib/supabase";

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : "The authentication request failed. Please try again.";
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(supabaseConfigurationError);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setSession(data.session);
      setError(sessionError?.message ?? null);
      setLoading(false);
    }).catch((sessionError: unknown) => {
      if (!active) return;
      setError(messageFor(sessionError));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError(null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    error,
    async signIn(email, password) {
      if (!supabase) throw new Error(supabaseConfigurationError ?? "Supabase is not configured.");
      setError(null);
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        throw authError;
      }
    },
    async signUp(email, password, username) {
      if (!supabase) throw new Error(supabaseConfigurationError ?? "Supabase is not configured.");
      setError(null);
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (authError) {
        setError(authError.message);
        throw authError;
      }
    },
    async signOut() {
      if (!supabase) throw new Error(supabaseConfigurationError ?? "Supabase is not configured.");
      setError(null);
      const { error: authError } = await supabase.auth.signOut();
      if (authError) {
        setError(authError.message);
        throw authError;
      }
    },
  }), [session, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
