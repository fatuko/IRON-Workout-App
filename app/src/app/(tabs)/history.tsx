import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, spacing } from '@/constants/theme';
import { workoutRepository } from '@/repositories';
import type { WorkoutExercise, WorkoutSession } from '@/types/workout';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value)).toUpperCase();
}

function formatDuration(session: WorkoutSession) {
  if (!session.completedAt) return '—';

  const totalSeconds = Math.max(
    0,
    Math.floor(
      (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000,
    ),
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) return hours + 'H ' + minutes + 'M';
  return Math.max(1, minutes) + ' MIN';
}

function completedExerciseCount(session: WorkoutSession) {
  return session.exercises.filter(
    (exercise) =>
      exercise.sets.length > 0 && exercise.sets.every((set) => set.complete),
  ).length;
}

function formatSet(exercise: WorkoutExercise, setIndex: number) {
  const set = exercise.sets[setIndex];

  if (!set.complete) return 'NOT COMPLETED';
  if (exercise.targetUnit === 'SEC') return set.seconds + ' SEC';

  return (
    set.weight +
    ' LB × ' +
    set.reps +
    (set.rir ? ' · RIR ' + set.rir : '')
  );
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);

      workoutRepository.getWorkoutHistory()
        .then((history) => {
          if (!active) return;
          setSessions(history);
          setLoadError(null);
        })
        .catch(() => {
          if (active) setLoadError('Could not load workout history.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={styles.page}>
      <Text style={styles.pageTitle}>HISTORY</Text>

      {loading && (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {!loading && loadError && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>COULD NOT LOAD HISTORY</Text>
          <Text style={styles.emptyText}>{loadError}</Text>
        </View>
      )}

      {!loading && !loadError && sessions.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>NO WORKOUTS YET</Text>
          <Text style={styles.emptyText}>
            Completed workouts will appear here.
          </Text>
        </View>
      )}

      {!loading && !loadError && (
        <View style={styles.sessionList}>
          {sessions.map((session) => {
            const expanded = expandedId === session.id;
            const completed = completedExerciseCount(session);

            return (
              <View key={session.id} style={styles.sessionCard}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    (expanded ? 'Collapse ' : 'Expand ') + session.workoutName
                  }
                  onPress={() => setExpandedId(expanded ? null : session.id)}
                  style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDate}>
                      {formatDate(session.startedAt)}
                    </Text>
                    <Text style={styles.sessionName}>{session.workoutName}</Text>
                    <Text style={styles.sessionSummary}>
                      {formatDuration(session)} · {completed} EXERCISES
                    </Text>
                  </View>
                  <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>
                    ⌄
                  </Text>
                </Pressable>

                {expanded && (
                  <View style={styles.exerciseList}>
                    {session.exercises.map((exercise, exerciseIndex) => (
                      <View key={exercise.id} style={styles.exerciseBlock}>
                        <View style={styles.exerciseHeader}>
                          <Text style={styles.exerciseNumber}>
                            {String(exerciseIndex + 1).padStart(2, '0')}
                          </Text>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                        </View>

                        <View style={styles.setList}>
                          {exercise.sets.map((set, setIndex) => (
                            <View key={set.id} style={styles.setRow}>
                              <Text style={styles.setLabel}>SET {setIndex + 1}</Text>
                              <Text
                                style={[
                                  styles.setValue,
                                  !set.complete && styles.incompleteValue,
                                ]}>
                                {formatSet(exercise, setIndex)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 112,
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  centerState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  sessionList: { gap: spacing.md },
  sessionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  sessionHeader: {
    minHeight: 112,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sessionInfo: { flex: 1, gap: 5 },
  sessionDate: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  sessionName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  sessionSummary: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 22,
    lineHeight: 24,
  },
  chevronExpanded: { transform: [{ rotate: '180deg' }] },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  exerciseBlock: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  exerciseNumber: {
    color: colors.accent,
    width: 24,
    fontSize: 9,
    fontWeight: '800',
  },
  exerciseName: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  setList: { gap: spacing.sm, paddingLeft: 36 },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  setLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  setValue: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
  incompleteValue: { color: colors.textSubtle },
});
