import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { AccountPage, Field, Action, Notice } from '@/components/account-ui';
import { authClient, supabase } from '@/lib/supabase';
import { validateEmail, validateName, validatePassword } from '@/auth/validation';
import { useAuth } from '@/auth/provider';
import { emailRedirect } from '@/auth/redirect';

export default function SignUp() {
  const router = useRouter();
  const { preview } = useAuth();
  const [first, setFirst] = useState(''), [last, setLast] = useState(''), [email, setEmail] = useState('');
  const [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  useEffect(() => { if (preview) { setFirst('Alex'); setLast('Morgan'); setEmail('alex@example.com'); setPassword('preview-only'); setConfirmation('preview-only'); } else { setFirst(''); setLast(''); setEmail(''); setPassword(''); setConfirmation(''); } }, [preview]);
  async function submit() {
    const invalid = validateName(first, last) || validateEmail(email) || validatePassword(password, confirmation);
    if (invalid) return setError(invalid);
    setBusy(true); setError(null);
    try {
      const { data, error } = await authClient().signUp({ email: email.trim(), password,
        options: { emailRedirectTo: emailRedirect(), data: { first_name: first.trim(), last_name: last.trim(), onboarding_complete: false } } });
      if (error) throw error;
      setPassword(''); setConfirmation('');
      if (!data.session) router.replace({ pathname: '/verify-email', params: { email: email.trim() } });
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create an account. Try again.'); }
    finally { setBusy(false); }
  }
  return <AccountPage title="Make it yours." subtitle="Create your account. Build your own way to train.">
    <Field label="First name" value={first} onChangeText={setFirst} autoCapitalize="words" autoComplete="given-name" maxLength={80} />
    <Field label="Last name" value={last} onChangeText={setLast} autoCapitalize="words" autoComplete="family-name" maxLength={80} />
    <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
    <Field label="Password" password value={password} onChangeText={setPassword} autoComplete="new-password" />
    <Notice text="Use at least 8 characters." />
    <Field label="Confirm password" password value={confirmation} onChangeText={setConfirmation} autoComplete="new-password" />
    <Notice error text={error} />
    {!supabase && !preview && <Notice text="Account services are being set up. Signup will be available soon." />}
    <Action title="Create account" busy={busy} disabled={!supabase && !preview} onPress={() => void submit()} />
    <Action title="Already have an account? Sign in" secondary onPress={() => router.replace('/sign-in')} />
  </AccountPage>;
}
