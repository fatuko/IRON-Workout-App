import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

type SplitDay = {
  id: string;
  name: string;
  muscles: string;
  schedule: string;
  exerciseCount: number;
  color: string;
  exercises: string[];
};

const splitDays: SplitDay[] = [
  {
    id: 'push',
    name: 'PUSH DAY',
    muscles: 'CHEST · SHOULDERS · TRICEPS',
    schedule: 'MON / THU',
    exerciseCount: 6,
    color: colors.accent,
    exercises: ['Incline Bench Press', 'Machine Chest Press', 'Cable Lateral Raise'],
  },
  {
    id: 'pull',
    name: 'PULL DAY',
    muscles: 'BACK · BICEPS · REAR DELTS',
    schedule: 'TUE / FRI',
    exerciseCount: 6,
    color: colors.orange,
    exercises: ['Lat Pulldown', 'Chest-Supported Row', 'Preacher Curl'],
  },
  {
    id: 'legs',
    name: 'LEGS DAY',
    muscles: 'QUADS · HAMS · GLUTES · CALVES',
    schedule: 'WED / SAT',
    exerciseCount: 6,
    color: colors.yellow,
    exercises: ['Hack Squat', 'Seated Leg Curl', 'Standing Calf Raise'],
  },
];

export default function SplitsScreen() {
  const router = useRouter();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={styles.page}>
      <View style={styles.programHeader}>
        <View>
          <Text style={styles.eyebrow}>PROGRAM</Text>
          <Text style={styles.programTitle}>PUSH PULL{'\n'}LEGS</Text>
          <Text style={styles.programSummary}>3 training days · 6 sessions per week</Text>
        </View>
      </View>

      <View style={styles.dayList}>
        {splitDays.map((day) => {
          const expanded = expandedDay === day.id;

          return (
            <View key={day.id} style={styles.dayCard}>
              <View style={styles.dayMainRow}>
                <View style={styles.dayInfo}>
                  <View style={styles.dayTitleRow}>
                    <View style={[styles.dayAccent, { backgroundColor: day.color }]} />
                    <Text style={styles.dayTitle}>{day.name}</Text>
                  </View>
                  <Text style={[styles.muscles, { color: day.color }]}>{day.muscles}</Text>
                  <Text style={styles.schedule}>
                    {day.schedule} · {day.exerciseCount} exercises
                  </Text>
                </View>

                <View style={styles.dayActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Start ${day.name}`}
                    onPress={() => router.push('/workout')}
                    style={({ pressed }) => [
                      styles.startButton,
                      { backgroundColor: day.color },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.startText}>START</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={expanded ? `Collapse ${day.name}` : `Expand ${day.name}`}
                    onPress={() => setExpandedDay(expanded ? null : day.id)}
                    hitSlop={10}
                    style={styles.expandButton}>
                    <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>⌄</Text>
                  </Pressable>
                </View>
              </View>

              {expanded && (
                <View style={styles.exerciseList}>
                  {day.exercises.map((exercise, index) => (
                    <View key={exercise} style={styles.exerciseRow}>
                      <Text style={styles.exerciseNumber}>{String(index + 1).padStart(2, '0')}</Text>
                      <Text style={styles.exerciseName}>{exercise}</Text>
                    </View>
                  ))}
                  <Text style={styles.moreExercises}>
                    + {day.exerciseCount - day.exercises.length} more exercises
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => Alert.alert('New split', 'The split builder will be added next.')}
        style={({ pressed }) => [styles.newSplitButton, pressed && styles.pressed]}>
        <Text style={styles.newSplitText}>＋ NEW SPLIT</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 56,
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
  programHeader: {
    flexDirection: 'row',
  },
  eyebrow: typography.eyebrow,
  programTitle: {
    color: colors.text,
    fontSize: 39,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: spacing.xs,
  },
  programSummary: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
    marginTop: spacing.md,
  },
  dayList: { gap: spacing.md },
  dayCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  dayMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  dayInfo: { flex: 1, minWidth: 0, gap: 6 },
  dayTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayAccent: { width: 5, height: 25 },
  dayTitle: {
    color: colors.text,
    fontSize: 25,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  muscles: { fontSize: 9, lineHeight: 13, fontWeight: '700', letterSpacing: 1.3 },
  schedule: { color: colors.textMuted, fontSize: 9, letterSpacing: 1 },
  dayActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  startButton: {
    minWidth: 58,
    minHeight: 43,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: { color: colors.text, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  expandButton: { width: 24, height: 42, alignItems: 'center', justifyContent: 'center' },
  chevron: { color: colors.textMuted, fontSize: 23, lineHeight: 24 },
  chevronExpanded: { transform: [{ rotate: '180deg' }] },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  exerciseNumber: { color: colors.textSubtle, fontSize: 10 },
  exerciseName: { color: colors.text, fontSize: 13 },
  moreExercises: { color: colors.textMuted, fontSize: 10, marginLeft: 28 },
  newSplitButton: {
    minHeight: 64,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSplitText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
  },
  pressed: { opacity: 0.72 },
});
