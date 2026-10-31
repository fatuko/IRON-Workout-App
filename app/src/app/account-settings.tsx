import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/provider';
import { readName, validateName } from '@/auth/validation';
import { AccountPage, Field, Action, Notice } from '@/components/account-ui';
import { authClient } from '@/lib/supabase';

export default function AccountSettings() {
  const { session, preview } = useAuth(), router = useRouter();
  const [first, setFirst] = useState(readName(session?.user.user_metadata.first_name)), [last, setLast] = useState(readName(session?.user.user_metadata.last_name));
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [notice, setNotice] = useState<string | null>(null);
  async function save() {
    const invalid = validateName(first, last); if (invalid) return setError(invalid);
    setBusy(true); setError(null); setNotice(null);
    try { const { error } = await authClient().updateUser({ data: { first_name: first.trim(), last_name: last.trim() } }); if (error) throw error; setNotice(preview ? 'Sample name updated for this preview only.' : 'Your name has been updated.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save your name.'); } finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError(null); setNotice(null);
    try { const { error } = await authClient().signOut({ scope: 'local' }); if (error) throw error; }
    catch { setError('Could not sign out. Please try again.'); } finally { setBusy(false); }
  }
  return <AccountPage eyebrow="IRON / ACCOUNT" title="Account settings." subtitle={session?.user.email ?? ''}>
    <Field label="First name" value={first} onChangeText={setFirst} autoCapitalize="words" maxLength={80} />
    <Field label="Last name" value={last} onChangeText={setLast} autoCapitalize="words" maxLength={80} />
    <Notice error text={error} /><Notice text={notice} />
    <Action title="Save name" busy={busy} onPress={() => void save()} />
    <Action title="Change password" secondary disabled={busy} onPress={() => router.push('/reset-password')} />
    <Action title="Sign out" secondary disabled={busy} onPress={() => void signOut()} />
    <Action title="Back to profile" secondary disabled={busy} onPress={() => router.replace('/profile')} />
  </AccountPage>;
}
