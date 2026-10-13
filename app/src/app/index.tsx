import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';
import { workoutRepository } from '@/repositories';
import type { WorkoutSession, WorkoutSplit } from '@/types/workout';
import { formatDaysAgo, getGreeting, getLocalDateKey, getLocalWeek } from '@/utils/date';

function getWorkoutStreak(history: WorkoutSession[], now: Date) {
  const completedDays = new Set(history.flatMap((session) =>
    session.completedAt ? [getLocalDateKey(session.completedAt)] : [],
  ));
  const cursor = new Date(now);
  if (!completedDays.has(getLocalDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (completedDays.has(getLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getWeeklyVolume(history: WorkoutSession[], weekKeys: Set<string>) {
  return history
    .filter((session) => session.completedAt && weekKeys.has(getLocalDateKey(session.completedAt)))
    .flatMap((session) => session.exercises)
    .flatMap((exercise) => exercise.sets)
    .filter((set) => set.complete)
    .reduce((total, set) => total + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);
}

function formatVolume(value: number) {
  return value >= 1000 ? (value / 1000).toFixed(1).replace('.0', '') + 'K' : String(value);
}

export default function HomeScreen() {
  const router = useRouter();
  const [split, setSplit] = useState<WorkoutSplit | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const loadHome = useCallback(async () => {
    setStarting(false);
    setError(null);
    try {
      const [activeSplit, workoutHistory] = await Promise.all([
        workoutRepository.getActiveSplit(),
        workoutRepository.getWorkoutHistory(),
      ]);
      setSplit(activeSplit);
      setHistory(workoutHistory);
      setNow(new Date());
    } catch {
      setError('HOME DATA COULD NOT BE LOADED');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadHome(); }, [loadHome]));

  const week = useMemo(() => getLocalWeek(now), [now]);
  const weekKeys = useMemo(() => new Set(week.map((day) => day.key)), [week]);
  const completedDays = useMemo(() => new Set(history.flatMap((session) =>
    session.completedAt ? [getLocalDateKey(session.completedAt)] : [],
  )), [history]);
  const nextDay = split && split.days.length > 0
    ? split.days[split.nextDayIndex % split.days.length]
    : null;
  const plannedSets = nextDay?.exercises.reduce(
    (total, exercise) => total + (Number(exercise.sets) || 0), 0,
  ) ?? 0;
  const lastMatchingWorkout = nextDay
    ? history.find((session) => session.splitDayId === nextDay.id)
    : null;
  const stats = [
    { label: 'STREAK', value: String(getWorkoutStreak(history, now)), unit: 'days' },
    { label: 'VOLUME', value: formatVolume(getWeeklyVolume(history, weekKeys)), unit: 'lbs this week' },
  ];

  const startWorkout = async () => {
    if (!nextDay || starting) return;
    setStarting(true);
    setError(null);
    try {
      const session = await workoutRepository.startWorkout(nextDay.id);
      router.push({ pathname: '/workout', params: { sessionId: session.id } });
    } catch (startError) {
      setError(startError instanceof Error ? startError.message.toUpperCase() : 'WORKOUT COULD NOT START');
      setStarting(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={styles.page}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{getGreeting(now)}</Text>
          <Text style={styles.greeting}>KIITE</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile" style={styles.profile}>
          <Text style={styles.profileText}>K</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>THIS WEEK</Text>
        <View style={styles.weekRow}>
          {week.map((item) => {
            const complete = completedDays.has(item.key);
            return (
              <View key={item.key} style={styles.dayColumn}>
                <View style={[styles.dayBox, complete && styles.dayBoxComplete, item.isToday && styles.dayBoxToday]}>
                  {complete && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.dayLabel, item.isToday && styles.dayLabelToday]}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingCard}><ActivityIndicator color={colors.accent} /></View>
      ) : nextDay ? (
        <View style={styles.workoutCard}>
          <View style={styles.workoutTopRow}>
            <Text style={styles.nextLabel}>NEXT WORKOUT</Text>
            <Text style={styles.daysAgo}>{formatDaysAgo(lastMatchingWorkout?.completedAt ?? null, now)}</Text>
          </View>
          <Text style={styles.workoutTitle}>{nextDay.name}</Text>
          <Text style={styles.workoutDay}>{nextDay.workoutDay}</Text>
          <View style={styles.workoutNumbers}>
            <View style={styles.numberGroup}>
              <Text style={styles.number}>{nextDay.exercises.length}</Text>
              <Text style={styles.numberLabel}>exercises</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.numberGroup}>
              <Text style={styles.number}>{plannedSets}</Text>
              <Text style={styles.numberLabel}>sets</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={starting}
            onPress={() => void startWorkout()}
            style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
          >
            <Text style={styles.startButtonText}>{starting ? 'STARTING…' : 'START WORKOUT'}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>NO WORKOUT SPLIT YET</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/splits')}>
            <Text style={styles.viewAll}>CREATE A SPLIT →</Text>
          </Pressable>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text numberOfLines={1} style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text numberOfLines={1} style={styles.statUnit}>{stat.unit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>RECENT WORKOUTS</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/history')}>
            <Text style={styles.viewAll}>VIEW ALL →</Text>
          </Pressable>
        </View>
        {history.length === 0 ? (
          <View style={styles.emptyHistoryCard}>
            <Text style={styles.emptyHistoryText}>COMPLETED WORKOUTS WILL SHOW HERE</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.slice(0, 3).map((session) => (
              <View key={session.id} style={styles.historyRow}>
                <Text numberOfLines={1} style={styles.historyName}>{session.workoutName}</Text>
                <Text style={styles.historyDate}>{formatDaysAgo(session.completedAt, now)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 48, gap: spacing.xl, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: typography.eyebrow,
  greeting: { ...typography.heading, marginTop: 2 },
  profile: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  profileText: { color: colors.text, fontSize: 19, fontWeight: '800' },
  panel: { padding: spacing.lg, gap: spacing.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  sectionTitle: typography.sectionTitle,
  weekRow: { flexDirection: 'row', gap: spacing.sm },
  dayColumn: { flex: 1, alignItems: 'center', gap: spacing.sm },
  dayBox: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  dayBoxComplete: { backgroundColor: colors.accent },
  dayBoxToday: { borderWidth: 1, borderColor: colors.accent },
  checkmark: { color: colors.text, fontSize: 16, fontWeight: '700' },
  dayLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  dayLabelToday: { color: colors.accent },
  loadingCard: { minHeight: 240, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accent, backgroundColor: '#100B0A' },
  workoutCard: { padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.accent, backgroundColor: '#100B0A', overflow: 'hidden' },
  workoutTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  nextLabel: { color: colors.accent, backgroundColor: colors.accentDark, paddingHorizontal: spacing.md, paddingVertical: 6, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  daysAgo: { flex: 1, color: colors.textMuted, fontSize: 10, textAlign: 'right' },
  workoutTitle: { color: colors.text, fontSize: 35, fontWeight: '900', letterSpacing: -1, marginTop: spacing.sm },
  workoutDay: { color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 2 },
  workoutNumbers: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginVertical: spacing.md },
  numberGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  number: { color: colors.text, fontSize: 29, fontWeight: '900' },
  numberLabel: { color: colors.textMuted, fontSize: 12 },
  divider: { width: 1, height: 28, backgroundColor: colors.border },
  startButton: { backgroundColor: colors.accent, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  pressed: { opacity: 0.78 },
  startButtonText: { color: colors.text, fontSize: 16, fontWeight: '900' },
  emptyCard: { minHeight: 180, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  errorText: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, minWidth: 0, padding: spacing.md, minHeight: 92, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  statLabel: { ...typography.sectionTitle, fontSize: 8, letterSpacing: 1.5 },
  statValue: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 5 },
  statUnit: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
  recentSection: { gap: spacing.lg },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  emptyHistoryCard: { minHeight: 72, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  emptyHistoryText: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  historyList: { gap: spacing.sm },
  historyRow: { minHeight: 66, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  historyName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  historyDate: { color: colors.textMuted, fontSize: 10 },
});
