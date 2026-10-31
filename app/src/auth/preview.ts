import type { Session } from '@supabase/supabase-js';

type PreviewState = { enabled: boolean; session: Session | null };
let state: PreviewState = { enabled: false, session: null };
const listeners = new Set<() => void>();
export const getPreview = () => state;
export const subscribePreview = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
function publish(next: PreviewState) { state = next; listeners.forEach(listener => listener()); }

export function startPreview() {
  if (!__DEV__) return;
  publish({ enabled: true, session: null });
}
export function exitPreview() { publish({ enabled: false, session: null }); }

export function enterPreviewAccount() {
  if (!__DEV__ || !state.enabled) return;
  const session: Session = {
    access_token: '', refresh_token: '', expires_in: 0, token_type: 'bearer',
    user: { id: 'development-preview', aud: 'preview', app_metadata: {},
      user_metadata: { first_name: 'Alex', last_name: 'Morgan', onboarding_complete: false },
      email: 'alex@example.com', created_at: '2026-10-01T12:00:00Z' },
  };
  publish({ enabled: true, session });
}

// In-memory UI simulation only. No Supabase request and no token persistence.
export const previewAuth = {
  async signUp(_input: unknown) { return { data: { session: null, user: null }, error: null }; },
  async signInWithPassword(_input: unknown) { enterPreviewAccount(); return { error: null }; },
  async resend(_input: unknown) { return { error: null }; },
  async resetPasswordForEmail(_email: string, _options: unknown) { return { error: null }; },
  async updateUser(input: { data?: Record<string, unknown>; password?: string }) {
    if (!state.session) throw new Error('Open the sample account first.');
    if (input.data) publish({ enabled: true, session: { ...state.session, user: { ...state.session.user,
      user_metadata: { ...state.session.user.user_metadata, ...input.data } } } });
    return { data: { user: state.session!.user }, error: null };
  },
  async signOut(_options: unknown) { publish({ enabled: true, session: null }); return { error: null }; },
  async exchangeCodeForSession(_code: string): Promise<never> { throw new Error('Email links are disabled in preview.'); },
  async setSession(_tokens: unknown): Promise<never> { throw new Error('Email links are disabled in preview.'); },
};
