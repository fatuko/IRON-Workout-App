import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as Haptics from 'expo-haptics';

import { colors, spacing, typography } from '@/constants/theme';
import { workoutRepository } from '@/repositories';
import type { WorkoutExercise, WorkoutSession, WorkoutSet, WorkoutSetField } from '@/types/workout';



function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getExerciseStatus(exercise: WorkoutExercise) {
  const completed = exercise.sets.filter((set) => set.complete).length;
  if (completed === 0) return 'NOT STARTED';
  if (completed === exercise.sets.length) return 'COMPLETED';
  return 'IN PROGRESS';
}

function hasPersonalRecord(exercise: WorkoutExercise) {
  if (exercise.targetUnit === 'SEC') return false;
  const previousBest = Number(exercise.lastPerformance.match(/([0-9.]+) lb/i)?.[1] ?? 0);
  return exercise.sets.some(
    (set) => set.complete && Number(set.weight) > previousBest,
  );
}

export default function WorkoutScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [animatedSetKey, setAnimatedSetKey] = useState<string | null>(null);
  const [reviewDuration, setReviewDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const checkScale = useRef(new Animated.Value(1)).current;
  const workoutStartedAt = useRef(Date.now());

  const exercise = exercises[activeIndex];
  const isTimedExercise = exercise?.targetUnit === 'SEC';
  const completedExerciseCount = exercises.filter(
    (item) => getExerciseStatus(item) === 'COMPLETED',
  ).length;
  const personalRecordCount = exercises.filter(hasPersonalRecord).length;

  useEffect(() => {
    let active = true;

    async function loadWorkout() {
      try {
        let savedSession = typeof sessionId === 'string'
          ? await workoutRepository.getWorkout(sessionId)
          : await workoutRepository.getDraftWorkout();

        if (
          savedSession &&
          savedSession.exercises.length === 0 &&
          savedSession.splitDayId
        ) {
          savedSession = await workoutRepository.startWorkout(savedSession.splitDayId);
        }

        if (!savedSession) {
          const split = await workoutRepository.getActiveSplit();
          const nextDay = split?.days[split.nextDayIndex] ?? split?.days[0];
          if (nextDay) savedSession = await workoutRepository.startWorkout(nextDay.id);
        }

        if (!active) return;
        if (!savedSession) {
          setLoadError('No workout is ready to start.');
          return;
        }

        setSession(savedSession);
        setExercises(savedSession.exercises);
        workoutStartedAt.current = new Date(savedSession.startedAt).getTime();
      } catch {
        if (active) setLoadError('Could not load this workout.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadWorkout();
    return () => {
      active = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (restRemaining === null || restRemaining <= 0) return;
    const timer = setInterval(() => {
      setRestRemaining((current) => {
        if (current === null || current <= 1) return 0;
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [restRemaining]);

  function updateSet(setId: number, field: WorkoutSetField, value: string) {
    if (!exercise) return;
    const currentSet = exercise.sets.find((set) => set.id === setId);
    if (!currentSet) return;

    const nextSet = { ...currentSet, [field]: value, complete: false };
    setExercises((current) => current.map((item, index) => (
      index !== activeIndex
        ? item
        : {
            ...item,
            sets: item.sets.map((set) => set.id === setId ? nextSet : set),
          }
    )));

    if (session) {
      void workoutRepository.saveWorkoutSet(session.id, exercise.id, nextSet);
    }
  }

  function toggleSet(setId: number) {
    const target = exercise.sets.find((set) => set.id === setId);
    if (!target) return;

    const missingTimedValue = isTimedExercise && !target.seconds;
    const missingStrengthValue = !isTimedExercise && (!target.weight || !target.reps || !target.rir);
    if (!target.complete && (missingTimedValue || missingStrengthValue)) {
      Alert.alert(
        'Complete the set',
        isTimedExercise
          ? 'Enter the completed seconds before marking this set done.'
          : 'Enter weight, reps, and RIR before marking this set done.',
      );
      return;
    }

    const nextSet = { ...target, complete: !target.complete };
    setExercises((current) => current.map((item, index) => (
      index !== activeIndex
        ? item
        : {
            ...item,
            sets: item.sets.map((set) => set.id === setId ? nextSet : set),
          }
    )));

    if (session) {
      void workoutRepository.saveWorkoutSet(session.id, exercise.id, nextSet);
    }

    if (!target.complete) {
      const setKey = exercise.id + '-' + setId;
      setAnimatedSetKey(setKey);
      checkScale.setValue(0.55);
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }).start(() => setAnimatedSetKey(null));
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRestRemaining(exercise.restSeconds);
    }
  }

  function addSet() {
    if (!exercise) return;
    const nextSet: WorkoutSet = {
      id: Math.max(0, ...exercise.sets.map((set) => set.id)) + 1,
      weight: '',
      reps: '',
      seconds: '',
      rir: '',
      complete: false,
    };

    setExercises((current) => current.map((item, index) => (
      index !== activeIndex
        ? item
        : { ...item, sets: [...item.sets, nextSet] }
    )));

    if (session) {
      void workoutRepository.saveWorkoutSet(session.id, exercise.id, nextSet);
    }
  }

  function openCompletion() {
    setReviewDuration((current) => (
      current ?? Math.max(1, Math.floor((Date.now() - workoutStartedAt.current) / 1000))
    ));
    setRestRemaining(null);
    setShowOverview(false);
    setShowReview(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function advanceExercise() {
    const hasIncompleteSets = exercise.sets.some((set) => !set.complete);
    const advance = () => {
      setRestRemaining(null);
      if (activeIndex === exercises.length - 1) openCompletion();
      else setActiveIndex((index) => index + 1);
    };

    if (!hasIncompleteSets) {
      advance();
      return;
    }

    Alert.alert(
      'Incomplete sets',
      'You can continue and return to this exercise later from the overview.',
      [
        { text: 'Keep logging', style: 'cancel' },
        { text: 'Continue', onPress: advance },
      ],
    );
  }

  function selectExercise(index: number) {
    setActiveIndex(index);
    setShowOverview(false);
    setShowReview(false);
  }

  async function saveWorkout() {
    if (!session) return;

    try {
      const completed = await workoutRepository.finishWorkout(session.id);
      setSession(completed);
      Alert.alert('Workout saved', completed.workoutName + ' complete.', [
        { text: 'Done', onPress: () => router.replace('/') },
      ]);
    } catch {
      Alert.alert('Could not save workout', 'Please try again.');
    }
  }

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (loadError || !session || !exercise) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{loadError ?? 'No workout exercises found.'}</Text>
      </View>
    );
  }

  if (showReview) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>WORKOUT COMPLETE</Text>
        <Text style={styles.screenTitle}>{session.workoutName}</Text>
        <Text style={styles.completionMessage}>{session.workoutName} complete.</Text>

        <View style={styles.completionStats}>
          <View style={styles.completionStat}>
            <Text style={styles.completionValue}>{formatTimer(reviewDuration ?? 0)}</Text>
            <Text style={styles.completionLabel}>DURATION</Text>
          </View>
          <View style={styles.completionStat}>
            <Text style={styles.completionValue}>{completedExerciseCount}</Text>
            <Text style={styles.completionLabel}>EXERCISES</Text>
          </View>
          <View style={styles.completionStat}>
            <Text style={styles.completionValue}>{personalRecordCount}</Text>
            <Text style={styles.completionLabel}>PRS</Text>
          </View>
        </View>

        <View style={styles.overviewList}>
          {exercises.map((item, index) => {
            const status = getExerciseStatus(item);
            return (
              <Pressable
                key={item.id}
                onPress={() => selectExercise(index)}
                style={styles.overviewRow}>
                <View style={styles.overviewNumber}>
                  <Text style={styles.overviewNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.overviewInfo}>
                  <Text style={styles.overviewName}>{item.name}</Text>
                </View>
                <Text style={status === 'COMPLETED' ? styles.doneStatus : styles.pendingStatus}>
                  {status}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={saveWorkout} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>SAVE WORKOUT</Text>
        </Pressable>
        <Pressable onPress={() => setShowReview(false)} style={styles.textButton}>
          <Text style={styles.textButtonLabel}>BACK TO WORKOUT</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (showOverview) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.page}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>WORKOUT</Text>
            <Text style={styles.screenTitle}>{session.workoutName}</Text>
          </View>
          <Pressable onPress={() => setShowOverview(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>CLOSE</Text>
          </Pressable>
        </View>
        <View style={styles.overviewList}>
          {exercises.map((item, index) => {
            const status = getExerciseStatus(item);
            return (
              <Pressable
                key={item.id}
                onPress={() => selectExercise(index)}
                style={[styles.overviewRow, index === activeIndex && styles.overviewRowActive]}>
                <View style={styles.overviewNumber}>
                  <Text style={styles.overviewNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.overviewInfo}>
                  <Text style={styles.overviewName}>{item.name}</Text>
                </View>
                <Text style={status === 'COMPLETED' ? styles.doneStatus : styles.pendingStatus}>
                  {status}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={openCompletion} style={styles.outlineButton}>
          <Text style={styles.outlineButtonText}>FINISH WORKOUT</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={styles.page}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>WORKOUT</Text>
          <Text style={styles.screenTitle}>{session.workoutName}</Text>
          <Text style={styles.progressText}>EXERCISE {activeIndex + 1} OF {exercises.length}</Text>
        </View>
        <Pressable onPress={() => setShowOverview(true)} style={styles.overviewButton}>
          <Text style={styles.overviewButtonText}>OVERVIEW</Text>
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((activeIndex + 1) / exercises.length) * 100}%` }]} />
      </View>

      {restRemaining !== null && (
        <View style={[styles.timerCard, restRemaining === 0 && styles.timerFinished]}>
          <View>
            <Text style={styles.timerLabel}>{restRemaining === 0 ? 'REST COMPLETE' : 'REST TIMER'}</Text>
            <Text style={styles.timerValue}>{formatTimer(restRemaining)}</Text>
          </View>
          <View style={styles.timerActions}>
            <Pressable onPress={() => setRestRemaining((value) => (value ?? 0) + 30)} style={styles.timerButton}>
              <Text style={styles.timerButtonText}>+30</Text>
            </Pressable>
            <Pressable onPress={() => setRestRemaining(null)} style={styles.timerButton}>
              <Text style={styles.timerButtonText}>SKIP</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.exerciseMetaRow}>
          <Text style={styles.repRange}>{exercise.sets.length} SETS · {exercise.repRange.toUpperCase()}</Text>
          <Text style={styles.restDefault}>REST {formatTimer(exercise.restSeconds)}</Text>
        </View>
        <Text style={styles.lastPerformance}>{exercise.lastPerformance}</Text>
      </View>

      <View style={styles.setTable}>
        <View style={styles.tableHeader}>
          <Text style={[styles.columnLabel, styles.setColumn]}>SET</Text>
          {isTimedExercise ? (
            <Text style={styles.columnLabel}>SECONDS</Text>
          ) : (
            <>
              <Text style={styles.columnLabel}>WEIGHT</Text>
              <Text style={styles.columnLabel}>REPS</Text>
              <Text style={styles.columnLabel}>RIR</Text>
            </>
          )}
          <View style={styles.doneColumn} />
        </View>

        {exercise.sets.map((set, index) => (
          <View key={set.id} style={[styles.setRow, set.complete && styles.setRowComplete]}>
            <Text style={[styles.setNumber, styles.setColumn]}>{String(index + 1).padStart(2, '0')}</Text>
            {isTimedExercise ? (
              <TextInput
                accessibilityLabel={'Set ' + (index + 1) + ' seconds'}
                keyboardType="number-pad"
                placeholder="—"
                placeholderTextColor={colors.textSubtle}
                value={set.seconds}
                onChangeText={(value) => updateSet(set.id, 'seconds', value)}
                style={styles.input}
              />
            ) : (
              <>
                <TextInput
                  accessibilityLabel={'Set ' + (index + 1) + ' weight'}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textSubtle}
                  value={set.weight}
                  onChangeText={(value) => updateSet(set.id, 'weight', value)}
                  style={styles.input}
                />
                <TextInput
                  accessibilityLabel={'Set ' + (index + 1) + ' reps'}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textSubtle}
                  value={set.reps}
                  onChangeText={(value) => updateSet(set.id, 'reps', value)}
                  style={styles.input}
                />
                <TextInput
                  accessibilityLabel={'Set ' + (index + 1) + ' RIR'}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textSubtle}
                  value={set.rir}
                  onChangeText={(value) => updateSet(set.id, 'rir', value)}
                  style={styles.input}
                />
              </>
            )}
            <Animated.View
              style={animatedSetKey === exercise.id + '-' + set.id
                ? { transform: [{ scale: checkScale }] }
                : undefined}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: set.complete }}
                accessibilityLabel={'Complete set ' + (index + 1)}
                onPress={() => toggleSet(set.id)}
                style={[styles.checkButton, set.complete && styles.checkButtonComplete]}>
                <Text style={styles.checkButtonText}>{set.complete ? '✓' : ''}</Text>
              </Pressable>
            </Animated.View>
          </View>
        ))}
      </View>

      <Pressable onPress={addSet} style={styles.addSetButton}>
        <Text style={styles.addSetText}>＋ ADD SET</Text>
      </Pressable>

      <View style={styles.navigationRow}>
        <Pressable
          disabled={activeIndex === 0}
          onPress={() => {
            setRestRemaining(null);
            setActiveIndex((index) => Math.max(0, index - 1));
          }}
          style={[styles.previousButton, activeIndex === 0 && styles.disabled]}>
          <Text style={styles.previousText}>← PREVIOUS</Text>
        </Pressable>
        <Pressable onPress={advanceExercise} style={styles.nextButton}>
          <Text style={styles.nextText}>
            {activeIndex === exercises.length - 1 ? 'REVIEW WORKOUT' : 'DONE · NEXT →'}
          </Text>
        </Pressable>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centerState: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  page: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 112,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: typography.eyebrow,
  screenTitle: { color: colors.text, fontSize: 35, fontWeight: '900', marginTop: 4 },
  progressText: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 5 },
  completionMessage: { color: colors.textMuted, fontSize: 13, marginTop: -spacing.md },
  completionStats: { flexDirection: 'row', gap: spacing.sm },
  completionStat: {
    flex: 1,
    minHeight: 76,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  completionValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  completionLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 1.2 },
  overviewButton: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
  },
  overviewButtonText: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  closeButton: { paddingHorizontal: spacing.md, paddingVertical: 10 },
  closeButtonText: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  progressTrack: { height: 3, backgroundColor: colors.checked },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  timerCard: {
    backgroundColor: colors.accentDark,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
  },
  timerFinished: { backgroundColor: colors.surface },
  timerLabel: { color: colors.accent, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  timerValue: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 2 },
  timerActions: { flexDirection: 'row', gap: spacing.sm },
  timerButton: { borderWidth: 1, borderColor: colors.accent, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: 9 },
  timerButtonText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  exerciseHeader: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: 16,
  },
  exerciseName: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  exerciseMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  repRange: { color: colors.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  restDefault: { color: colors.textMuted, fontSize: 9, letterSpacing: 1 },
  lastPerformance: {
    color: colors.text,
    fontSize: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  setTable: { gap: spacing.sm },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  columnLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 8,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  setColumn: { flex: 0, width: 28 },
  doneColumn: { width: 42 },
  setRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  setRowComplete: { borderColor: colors.accent, backgroundColor: colors.accentDark },
  setNumber: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  input: {
    flex: 1,
    minWidth: 0,
    height: 42,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    borderRadius: 10,
  },
  checkButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  checkButtonComplete: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkButtonText: { color: colors.text, fontSize: 17, fontWeight: '900' },
  addSetButton: {
    minHeight: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  addSetText: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  navigationRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  previousButton: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  previousText: { color: colors.text, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  nextButton: {
    flex: 1.6,
    minHeight: 54,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  nextText: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  disabled: { opacity: 0.3 },
  overviewList: { gap: spacing.sm },
  overviewRow: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 14,
  },
  overviewRowActive: { borderColor: colors.accent },
  overviewNumber: {
    width: 34,
    height: 34,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  overviewNumberText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  overviewInfo: { flex: 1, minWidth: 0 },
  overviewName: { color: colors.text, fontSize: 14, fontWeight: '800' },
  doneStatus: { color: colors.text, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  pendingStatus: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  primaryButton: {
    minHeight: 58,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  primaryButtonText: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  outlineButton: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  outlineButtonText: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
});
