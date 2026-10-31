import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AccountPage, Field, Action, Notice } from '@/components/account-ui';
import { authClient, supabase } from '@/lib/supabase';
import { validateEmail } from '@/auth/validation';
import { emailRedirect } from '@/auth/redirect';
export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState(''), [sent, setSent] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    const invalid = validateEmail(email); if (invalid) return setError(invalid);
    setBusy(true); setError(null);
    try { const { error } = await authClient().resetPasswordForEmail(email.trim(), { redirectTo: emailRedirect() }); if (error) throw error; setSent(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not send the reset link.'); } finally { setBusy(false); }
  }
  return <AccountPage title="Reset your password." subtitle="We’ll email you a link to choose a new password.">
    <Field label="Email" value={email} onChangeText={(value) => { setEmail(value); setSent(false); }} keyboardType="email-address" autoComplete="email" />
    <Notice text={sent ? 'If an account exists for this email, a reset link is on its way.' : null} /><Notice error text={error} />
    <Action title={sent ? 'Link requested' : 'Send reset link'} busy={busy} disabled={!supabase || sent} onPress={() => void submit()} />
    <Action title="Back" secondary onPress={() => router.canGoBack() ? router.back() : router.replace('/sign-in')} />
  </AccountPage>;
}
