import type { User } from '@supabase/supabase-js';
import { useCallback, useState, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '@/auth/provider';
import { authClient } from '@/lib/supabase';
import { formatRestTimer, parseRestTimer, restTimerSeconds } from '@/utils/rest-timer';
import { readName, validateName, validateEmail } from '@/auth/validation';
import { colors, spacing } from '@/constants/theme';
import { workoutRepository } from '@/repositories';
import { profileStats } from '@/utils/profile-stats';

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

export default function Profile() {
  const { session } = useAuth();
  return session ? <MemberProfile user={session.user} /> : null;
}

function MemberProfile({ user }: { user: User }) {
  const router = useRouter();
  const [editingMember, setEditingMember] = useState(false);
  const [editingTimer, setEditingTimer] = useState(false);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [minutes, setMinutes] = useState('2');
  const [seconds, setSeconds] = useState('00');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const timer = restTimerSeconds(user.user_metadata.rest_seconds);

  async function saveMember() {
    if (busyRef.current) return;
    const invalid = validateName(first, last) || validateEmail(email);
    if (invalid) { setMessage(invalid); return; }
    busyRef.current = true; setBusy(true); setMessage(null);
    const emailChanged = email.trim() !== user.email;
    try {
      const { error } = await authClient().updateUser({
        data: { first_name: first.trim(), last_name: last.trim() },
        ...(emailChanged ? { email: email.trim() } : {}),
      });
      if (error) throw error;
      setEditingMember(false); Keyboard.dismiss();
      if (emailChanged) setMessage('Check your email to confirm the address change.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save changes.'); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function saveTimer() {
    if (busyRef.current) return;
    const value = parseRestTimer(minutes, seconds);
    if (value === null) { setMessage('Enter a rest time from 0:05 to 60:00. Seconds must be 00–59.'); return; }
    busyRef.current = true; setBusy(true); setMessage(null);
    try {
      const { error } = await authClient().updateUser({ data: { rest_seconds: value } });
      if (error) throw error;
      setEditingTimer(false); Keyboard.dismiss();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save rest timer.'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  const [stats, setStats] = useState<ReturnType<typeof profileStats> | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    workoutRepository.getWorkoutHistory()
      .then(history => { if (active) setStats(profileStats(history)); })
      .catch(() => { if (active) setStats(null); });
    return () => { active = false; };
  }, [user.id]));
  const name = [readName(user.user_metadata.first_name), readName(user.user_metadata.last_name)].filter(Boolean).join(' ');
  const joinedDate = new Date(user.created_at);
  const joined = Number.isNaN(joinedDate.getTime()) ? '—' : joinedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.page}>
    <View style={styles.headingRow}>
      <Text style={styles.heading}>MEMBER INFO</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Account settings" onPress={() => router.push('/account-settings')} style={styles.settings}>
        <SymbolView name={{ ios: 'gearshape', android: 'settings', web: 'settings' }} size={22} tintColor={colors.textMuted} />
      </Pressable>
    </View>
    <View style={styles.card}>
      {editingMember ? <>
        {[['First name', first, setFirst], ['Last name', last, setLast], ['Email', email, setEmail]].map(([label, value, change]) => (
          <View key={label as string} style={styles.row}><Text style={styles.label}>{label as string}</Text>
            <TextInput accessibilityLabel={label as string} editable={!busy} value={value as string} onChangeText={change as (text: string) => void}
              autoCapitalize={label === 'Email' ? 'none' : 'words'} keyboardType={label === 'Email' ? 'email-address' : 'default'} style={styles.input} />
          </View>
        ))}
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void saveMember()} style={styles.edit}><Text style={styles.editText}>{busy ? 'Saving…' : 'Save'}</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setEditingMember(false); setMessage(null); Keyboard.dismiss(); }} style={styles.edit}><Text style={styles.label}>Cancel</Text></Pressable>
        </View>
      </> : <>
        <InfoRow label="Name" value={name || '—'} />
        <InfoRow label="Email" value={user.email || '—'} />
        <Pressable accessibilityRole="button" accessibilityLabel="Edit member info" disabled={busy} onPress={() => {
          setFirst(readName(user.user_metadata.first_name)); setLast(readName(user.user_metadata.last_name)); setEmail(user.email ?? '');
          setMessage(null); setEditingTimer(false); setEditingMember(true);
        }} style={styles.edit}><Text style={styles.editText}>Edit</Text></Pressable>
      </>}
    </View>
    <Text style={styles.heading}>ACCOUNT INFO</Text>
    <View style={styles.card}>
      <InfoRow label="Date joined" value={joined} />
      {editingTimer ? <>
        <Text style={styles.label}>Rest timer</Text>
        <View style={styles.actions}>
          <View style={styles.timerField}><Text style={styles.label}>Minutes</Text><TextInput accessibilityLabel="Rest minutes" editable={!busy} value={minutes} onChangeText={setMinutes} keyboardType="number-pad" maxLength={2} style={styles.input} /></View>
          <View style={styles.timerField}><Text style={styles.label}>Seconds</Text><TextInput accessibilityLabel="Rest seconds" editable={!busy} value={seconds} onChangeText={setSeconds} keyboardType="number-pad" maxLength={2} style={styles.input} /></View>
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void saveTimer()} style={styles.edit}><Text style={styles.editText}>{busy ? 'Saving…' : 'Save'}</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setEditingTimer(false); setMessage(null); Keyboard.dismiss(); }} style={styles.edit}><Text style={styles.label}>Cancel</Text></Pressable>
        </View>
      </> : <>
        <InfoRow label="Rest timer" value={formatRestTimer(timer)} />
        <Pressable accessibilityRole="button" accessibilityLabel="Edit rest timer" disabled={busy} onPress={() => {
          setMinutes(String(Math.floor(timer / 60))); setSeconds(String(timer % 60).padStart(2, '0'));
          setMessage(null); setEditingMember(false); setEditingTimer(true);
        }} style={styles.edit}><Text style={styles.editText}>Edit</Text></Pressable>
      </>}
    </View>
    {message && <Text accessibilityRole="alert" style={styles.label}>{message}</Text>}
    <Text style={styles.heading}>STATS</Text>
    <View style={styles.stats}>
      {[
        ['Workouts', stats?.workouts],
        ['Weekly streak', stats ? `${stats.streak}w` : undefined],
        ['PRs', stats?.records],
      ].map(([label, value]) => <View key={label} style={styles.stat}>
        <Text style={styles.statValue}>{value ?? '—'}</Text><Text style={styles.statLabel}>{label}</Text>
      </View>)}
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: 130, gap: 16 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: 1, marginTop: 8 },
  settings: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 20, gap: 24, marginBottom: 12 },
  row: { gap: 8 },
  actions: { flexDirection: 'row', gap: 12 },
  timerField: { flex: 1, gap: 8 },
  input: { color: colors.text, fontSize: 16, minHeight: 46, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
  edit: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', alignSelf: 'flex-start' },
  editText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  label: { color: colors.textMuted, fontSize: 12 },
  value: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '500' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 4, gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18 },
  statValue: { color: colors.accent, fontSize: 25, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 10, textAlign: 'center' },
});
