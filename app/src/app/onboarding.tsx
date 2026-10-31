import { useState } from 'react';
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { AccountPage, Field, Action, Notice, ui } from '@/components/account-ui';
import { authClient } from '@/lib/supabase';
import { workoutRepository } from '@/repositories';

export default function Onboarding() {
  const [name, setName] = useState('My split'), [busy, setBusy] = useState(false), [destination, setDestination] = useState<'/splits' | '/' | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function complete(create: boolean) {
    if (create && !name.trim()) return setError('Give your split a name.');
    setBusy(true); setError(null);
    try {
      if (create) { const split = await workoutRepository.getActiveSplit(); if (split) await workoutRepository.saveActiveSplit({ ...split, name: name.trim() }); }
      // Preference only: never used for database authorization.
      const { error } = await authClient().updateUser({ data: { onboarding_complete: true } });
      if (error) throw error;
      setDestination(create ? '/splits' : '/');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not finish setup. Try again.'); } finally { setBusy(false); }
  }
  if (destination) return <Redirect href={destination} />;
  return <AccountPage eyebrow="IRON / FIRST STEPS" title="Your split. Your rules." subtitle="Build a routine around the way you train. You can change it anytime.">
    <View style={ui.card}><Text style={ui.label}>01   Create your workouts</Text><Text style={ui.label}>02   Add exercises and set targets</Text><Text style={ui.label}>03   Choose your training days</Text></View>
    <Field label="Split name" value={name} onChangeText={setName} autoCapitalize="words" maxLength={60} />
    <Notice error text={error} />
    <Action title="Create my split" busy={busy} onPress={() => void complete(true)} />
    <Action title="Skip for now" secondary disabled={busy} onPress={() => void complete(false)} />
  </AccountPage>;
}
