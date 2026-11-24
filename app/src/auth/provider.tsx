import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { setWorkoutUser } from '@/repositories';

const Context = createContext<{ session: Session | null; loading: boolean; error: string | null }>({ session: null, loading: true, error: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;
    let revision = 0;
    function apply(next: Session | null) {
      if (!active) return;
      try {
        setWorkoutUser(next?.user.id ?? null);
        setSession(next);
        setError(null);
      } catch {
        setSession(null);
        setError('Your saved workouts could not be loaded. Please restart the app.');
      }
      setLoading(false);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => { revision++; apply(next); });
    const initialRevision = revision;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || revision !== initialRevision) return;
      if (sessionError) { apply(null); setError('Could not restore your session. Please sign in again.'); }
      else apply(data.session);
    }).catch(() => { if (active) { setError('Could not restore your session. Please try again.'); setLoading(false); } });
    const refresh = (state: string) => {
      if (Platform.OS === 'web') return;
      if (state === 'active') supabase!.auth.startAutoRefresh();
      else supabase!.auth.stopAutoRefresh();
    };
    refresh(AppState.currentState ?? 'active');
    const listener = AppState.addEventListener('change', refresh);
    return () => { active = false; subscription.unsubscribe(); listener.remove(); if (Platform.OS !== 'web') supabase!.auth.stopAutoRefresh(); };
  }, []);
  return <Context.Provider value={{ session, loading, error }}>{children}</Context.Provider>;
}

export const useAuth = () => useContext(Context);
