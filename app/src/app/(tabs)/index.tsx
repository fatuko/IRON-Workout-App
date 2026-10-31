import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/provider';
import { readName } from '@/auth/validation';

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

function getCompletedSetCount(session: WorkoutSession) {
  return session.exercises
    .flatMap((exercise) => exercise.sets)
    .filter((set) => set.complete)
    .length;
}

type PersonalRecord = {
  id: string;
  exerciseName: string;
  previousWeight: number | null;
  newWeight: number;
  reps: number;
  completedAt: string;
};

function getPersonalRecords(history: WorkoutSession[]): PersonalRecord[] {
  return history.flatMap((session) => session.exercises.flatMap((exercise) => {
    if (!session.completedAt || exercise.targetUnit !== 'REPS') return [];

    const bestSet = exercise.sets
      .filter((set) => set.complete && (Number(set.weight) || 0) > 0)
      .sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0))[0];
    if (!bestSet) return [];

    const previousMatch = exercise.lastPerformance.match(/([\d.]+)\s*LB/i);
    const previousWeight = previousMatch ? Number(previousMatch[1]) : null;
    const newWeight = Number(bestSet.weight) || 0;
    if (previousWeight !== null && newWeight <= previousWeight) return [];

    return [{
      id: session.id + '-' + exercise.id,
      exerciseName: exercise.name,
      previousWeight,
      newWeight,
      reps: Number(bestSet.reps) || 0,
      completedAt: session.completedAt,
    }];
  }));
}

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const firstName = readName(session?.user.user_metadata.first_name) || 'Athlete';
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
  const dailySetCounts = week.map((day) => history
    .filter((session) => session.completedAt && getLocalDateKey(session.completedAt) === day.key)
    .reduce((total, session) => total + getCompletedSetCount(session), 0));
  const maxDailySets = Math.max(...dailySetCounts, 1);
  const streak = getWorkoutStreak(history, now);
  const personalRecords = getPersonalRecords(history);
  const weeklyPersonalRecords = personalRecords.filter((record) =>
    week.some((day) => day.key === getLocalDateKey(record.completedAt)),
  );

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
          <Text style={styles.greeting}>{firstName.toUpperCase()}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={styles.profile}>
          <Text style={styles.profileText}>{firstName.charAt(0).toUpperCase()}</Text>
        </Pressable>
      </View>

      <View style={styles.weekTracker}>
        {week.map((item) => {
          const complete = completedDays.has(item.key);
          const weekday = item.date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
          return (
            <View key={item.key} style={styles.dayColumn}>
              <Text style={[styles.dayLabel, item.isToday && styles.dayLabelToday]}>{weekday}</Text>
              <View style={[styles.dayBox, complete && styles.dayBoxComplete, item.isToday && !complete && styles.dayBoxToday]}>
                <Text style={[styles.dayNumber, complete && styles.dayNumberComplete]}>{item.date.getDate()}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingCard}><ActivityIndicator color={colors.accent} /></View>
      ) : nextDay ? (
        <View style={styles.workoutCard}>
          <SymbolView
            name={{ ios: 'dumbbell.fill', android: 'fitness_center', web: 'fitness_center' }}
            size={132}
            tintColor={colors.accent}
            style={styles.workoutWatermark}
          />
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

      <View style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>ACTIVITY</Text>
          <View style={styles.activityMetrics}>
            <View>
              <Text style={styles.metricValue}>{streak}</Text>
              <Text style={styles.metricLabel}>DAY STREAK</Text>
            </View>
            <View style={styles.metricDivider} />
            <View>
              <Text style={styles.metricValue}>{weeklyPersonalRecords.length}</Text>
              <Text style={styles.metricLabel}>PRS THIS WEEK</Text>
            </View>
          </View>
        </View>

        <View style={styles.chart}>
          {week.map((day, index) => {
            const barHeight = dailySetCounts[index] === 0
              ? 5
              : Math.max(10, Math.round((dailySetCounts[index] / maxDailySets) * 58));
            return (
              <View key={day.key} style={styles.chartColumn}>
                <View style={styles.barTrack}>
                  <View style={[
                    styles.volumeBar,
                    { height: barHeight },
                    dailySetCounts[index] === 0 && styles.volumeBarEmpty,
                    day.isToday && styles.volumeBarToday,
                  ]} />
                </View>
                <Text style={[styles.chartLabel, day.isToday && styles.chartLabelToday]}>{day.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>RECENT PRS</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/history')}>
            <Text style={styles.viewAll}>VIEW ALL →</Text>
          </Pressable>
        </View>
        {personalRecords.length === 0 ? (
          <View style={styles.emptyHistoryCard}>
            <Text style={styles.emptyHistoryText}>YOUR PRS WILL SHOW HERE</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {personalRecords.slice(0, 3).map((record) => (
              <View key={record.id} style={styles.historyRow}>
                <View style={styles.prNameGroup}>
                  <Text numberOfLines={1} style={styles.historyName}>{record.exerciseName}</Text>
                  <Text style={styles.historyDate}>{formatDaysAgo(record.completedAt, now)}</Text>
                </View>
                <View style={styles.prResult}>
                  <Text style={styles.previousPr}>{record.previousWeight ?? 'NEW'}</Text>
                  <Text style={styles.currentPr}>{record.newWeight}</Text>
                  <Text style={styles.prUnit}>LB × {record.reps}</Text>
                </View>
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
  page: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 112, gap: spacing.xl, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: typography.eyebrow,
  greeting: { ...typography.heading, marginTop: 2 },
  profile: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  profileText: { color: colors.text, fontSize: 19, fontWeight: '800' },
  sectionTitle: typography.sectionTitle,
  weekTracker: { flexDirection: 'row', gap: spacing.sm },
  dayColumn: { flex: 1, alignItems: 'center', gap: 7 },
  dayBox: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised, borderRadius: 10 },
  dayBoxComplete: { backgroundColor: colors.accent },
  dayBoxToday: { borderWidth: 1, borderColor: colors.accent },
  dayNumber: { color: colors.textMuted, fontSize: 14, fontWeight: '800' },
  dayNumberComplete: { color: colors.text },
  dayLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  dayLabelToday: { color: colors.accent },
  loadingCard: { minHeight: 240, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accent, borderRadius: 20, backgroundColor: '#100B0A' },
  workoutCard: { position: 'relative', padding: spacing.xl, gap: spacing.sm, borderWidth: 1, borderColor: colors.accent, borderRadius: 20, backgroundColor: '#100B0A', overflow: 'hidden' },
  workoutWatermark: { position: 'absolute', right: -24, top: 38, opacity: 0.08, transform: [{ rotate: '-14deg' }] },
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
  startButton: { backgroundColor: colors.accent, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs, borderRadius: 12 },
  pressed: { opacity: 0.78 },
  startButtonText: { color: colors.text, fontSize: 16, fontWeight: '900' },
  emptyCard: { minHeight: 180, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  errorText: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  activityCard: { padding: spacing.lg, gap: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  activityMetrics: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  metricValue: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'right' },
  metricLabel: { color: colors.textMuted, fontSize: 7, fontWeight: '800', letterSpacing: 0.8, marginTop: 2, textAlign: 'right' },
  metricDivider: { width: 1, height: 34, backgroundColor: colors.border },
  chart: { height: 88, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  chartColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 7 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  volumeBar: { width: '58%', minHeight: 5, borderRadius: 6, backgroundColor: colors.accent },
  volumeBarEmpty: { backgroundColor: colors.checked },
  volumeBarToday: { borderWidth: 1, borderColor: colors.orange },
  chartLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '800' },
  chartLabelToday: { color: colors.accent },
  recentSection: { gap: spacing.lg },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  emptyHistoryCard: { minHeight: 72, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  emptyHistoryText: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  historyList: { gap: spacing.sm },
  historyRow: { minHeight: 66, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  prNameGroup: { flex: 1, minWidth: 0, gap: 4 },
  historyName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  historyDate: { color: colors.textMuted, fontSize: 9 },
  prResult: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  previousPr: { color: colors.textSubtle, fontSize: 10, textDecorationLine: 'line-through' },
  currentPr: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  prUnit: { color: colors.textMuted, fontSize: 9 },
});
