import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '@/auth/provider';
import { readName } from '@/auth/validation';
import { AccountPage, Action, Notice, ui } from '@/components/account-ui';
import { workoutRepository } from '@/repositories';
import { profileStats } from '@/utils/profile-stats';

export default function Profile() {
  const { session } = useAuth(), router = useRouter();
  const user = session!.user;
  const [stats, setStats] = useState<ReturnType<typeof profileStats> | null>(null), [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    workoutRepository.getWorkoutHistory().then(history => { if (active) { setStats(profileStats(history)); setError(null); } })
      .catch(() => { if (active) { setStats(null); setError('Could not load your workout stats.'); } });
    return () => { active = false; };
  }, [user.id]));
  const name = [readName(user.user_metadata.first_name), readName(user.user_metadata.last_name)].filter(Boolean).join(' ') || 'Your profile';
  const joined = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return <AccountPage eyebrow="IRON / PROFILE" title={name} subtitle={'Joined ' + joined}>
    <View style={ui.card}>
      {[['Workouts completed', stats?.workouts], ['Weekly streak', stats ? `${stats.streak} ${stats.streak === 1 ? 'week' : 'weeks'}` : undefined], ['Personal records', stats?.records]].map(([label, value]) =>
        <View key={label} style={ui.row}><Text style={ui.label}>{label}</Text><Text style={ui.stat}>{value ?? '—'}</Text></View>)}
    </View>
    <Notice error text={error} />
    <Notice text={stats?.workouts === 0 ? 'Complete your first workout to start tracking your progress.' : 'Keep your weekly streak with at least one completed workout each week.'} />
    <Notice text="Workout stats are saved on this device. Cloud sync is not available yet." />
    <Action title="Account settings" onPress={() => router.push('/account-settings')} />
    <Action title="Back to training" secondary onPress={() => router.replace('/')} />
  </AccountPage>;
}
