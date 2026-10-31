import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AccountPage, Field, Action, Notice } from '@/components/account-ui';
import { authClient, supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/provider';
import { validateEmail } from '@/auth/validation';

export default function SignIn() {
  const router = useRouter();
  const { error: sessionError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    const invalid = validateEmail(email) || (!password ? 'Enter your password.' : null);
    if (invalid) return setError(invalid);
    setBusy(true); setError(null);
    try {
      const { error } = await authClient().signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (error.code === 'email_not_confirmed') { router.push({ pathname: '/verify-email', params: { email: email.trim() } }); return; }
        throw error;
      }
      setPassword('');
      // Protected route groups select onboarding or Home after the auth event.
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in. Try again.'); }
    finally { setBusy(false); }
  }
  return <AccountPage title="Welcome back." subtitle="Your training. Your progress. Pick up where you left off.">
    <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
    <Field label="Password" password value={password} onChangeText={setPassword} autoComplete="current-password" onSubmitEditing={() => !busy && void submit()} />
    <Notice error text={error || sessionError} />
    {!supabase && <Notice text="Account services are being set up. Sign-in will be available soon." />}
    <Action title="Sign in" busy={busy} disabled={!supabase} onPress={() => void submit()} />
    <Action title="Forgot password?" secondary onPress={() => router.push('/forgot-password')} />
    <Action title="New to IRON? Create an account" secondary onPress={() => router.push('/sign-up')} />
  </AccountPage>;
}
