import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AccountPage, Field, Action, Notice } from '@/components/account-ui';
import { authClient } from '@/lib/supabase';
import { useAuth } from '@/auth/provider';
import { validatePassword } from '@/auth/validation';
export default function ResetPassword() {
  const router = useRouter(), { session, preview } = useAuth();
  const [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState<string | null>(null);
  async function submit() {
    const invalid = validatePassword(password, confirmation); if (invalid) return setError(invalid);
    setBusy(true); setError(null);
    try { const { error } = await authClient().updateUser({ password }); if (error) throw error; setPassword(''); setConfirmation(''); setSaved(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not change your password.'); } finally { setBusy(false); }
  }
  return <AccountPage title={saved ? (preview ? 'Password change previewed.' : 'Password updated.') : 'Choose a new password.'} subtitle={saved ? (preview ? 'No password was changed or stored.' : 'You’re ready to get back to training.') : 'Use at least 8 characters.'}>
    {!saved && <><Field label="New password" password value={password} onChangeText={setPassword} autoComplete="new-password" />
      <Field label="Confirm new password" password value={confirmation} onChangeText={setConfirmation} autoComplete="new-password" />
      <Notice error text={error} /><Action title="Save password" busy={busy} onPress={() => void submit()} /></>}
    <Action title={saved ? 'Continue' : 'Cancel'} secondary={!saved} onPress={() => router.replace(session?.user.user_metadata.onboarding_complete === true ? '/' : '/onboarding')} />
  </AccountPage>;
}
