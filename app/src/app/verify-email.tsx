import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AccountPage, Field, Action, Notice } from '@/components/account-ui';
import { authClient } from '@/lib/supabase';
import { validateEmail } from '@/auth/validation';
import { useAuth } from '@/auth/provider';
import { enterPreviewAccount } from '@/auth/preview';
import { emailRedirect } from '@/auth/redirect';

export default function VerifyEmail() {
  const params = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const { preview } = useAuth();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [busy, setBusy] = useState(false), [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null), [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);
  async function resend() {
    const invalid = validateEmail(email); if (invalid) return setError(invalid);
    setBusy(true); setError(null); setNotice(null);
    try {
      const { error } = await authClient().resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: emailRedirect() } });
      if (error) throw error;
      setNotice(preview ? 'Preview: resend simulated. No email was sent.' : 'If this account needs confirmation, a new link is on its way. Check your spam folder too.'); setCooldown(60);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not resend the email.'); }
    finally { setBusy(false); }
  }
  return <AccountPage title="Check your inbox." subtitle="Open the confirmation link in your email to verify your account. If you already have an account, sign in instead.">
    {preview && <Action title="Simulate email verification" onPress={enterPreviewAccount} />}
    <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
    <Notice text={notice} /><Notice text={error} error />
    <Action title={cooldown ? `Resend in ${cooldown}s` : 'Resend confirmation'} busy={busy} disabled={cooldown > 0} onPress={() => void resend()} />
    <Action title="Use a different email to sign up" secondary onPress={() => router.replace('/sign-up')} />
    <Action title="Back to sign in" secondary onPress={() => router.replace('/sign-in')} />
  </AccountPage>;
}
