import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';

import * as Haptics from 'expo-haptics';

import { useAuth } from '@/auth/provider';
import { restTimerSeconds } from '@/utils/rest-timer';
import { ExerciseSelector } from '@/components/exercise-selector';
import { colors, spacing, typography } from '@/constants/theme';
import { workoutRepository } from '@/repositories';
import { loadWorkoutPage, type WorkoutPage } from '@/utils/resolve-workout';
import type { WorkoutExercise, WorkoutSession, WorkoutSet, WorkoutSetField } from '@/types/workout';



if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animateLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);


function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatPreviousSet(exercise: WorkoutExercise, set: WorkoutSet) {
  if (exercise.targetUnit === 'SEC') return set.seconds ? set.seconds + ' SEC' : '—';
  if (!set.weight || !set.reps) return '—';
  return set.weight + ' LB × ' + set.reps + (set.rir ? ' · RIR ' + set.rir : '');
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
  const { session: account } = useAuth();
  const restSeconds = restTimerSeconds(account?.user.user_metadata.rest_seconds);
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [landing, setLanding] = useState<WorkoutPage | null>(null);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const startingRef = useRef(false);
  const savingRef = useRef(false);
  const [animatedSetKey, setAnimatedSetKey] = useState<string | null>(null);
  const [reviewDuration, setReviewDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadedSessionId = useRef<string | null>(null);
  const checkScale = useRef(new Animated.Value(1)).current;
  const workoutStartedAt = useRef(Date.now());

  const exercise = exercises[activeIndex];
  const isTimedExercise = exercise?.targetUnit === 'SEC';
  const completedExerciseCount = exercises.filter(
    (item) => getExerciseStatus(item) === 'COMPLETED',
  ).length;
  const personalRecordCount = exercises.filter(hasPersonalRecord).length;

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    async function loadWorkout() {
      try {
        const page = await loadWorkoutPage(workoutRepository, sessionId);
        if (!active) return;
        setLanding(page);
        if (page.kind !== 'session') {
          setSession(null); setExercises([]); setShowOverview(false);
          return;
        }
        let savedSession = page.session;

        if (
          savedSession &&
          savedSession.exercises.length === 0 &&
          savedSession.splitDayId
        ) {
          savedSession = await workoutRepository.startWorkout(savedSession.splitDayId);
        }

        if (!active) return;
        if (loadedSessionId.current !== savedSession.id) {
          setActiveIndex(0); setRestRemaining(null); setShowOverview(false); setReviewDuration(null);
          loadedSessionId.current = savedSession.id;
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
  }, [sessionId]));

  useEffect(() => {
    if (restRemaining === null || restRemaining <= 0) return;
    const timer = setInterval(() => {
      setRestRemaining((current) => {
        if (current === null || current <= 1) return null;
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
      animateLayout();
      setRestRemaining(restSeconds);
    }
  }

  function addSet() {
    if (!exercise) return;
    animateLayout();
    void Haptics.selectionAsync();
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

  function removeSet(setId: number) {
    if (!exercise || !session) return;
    if (exercise.sets.length === 1) {
      Alert.alert('Keep one set', 'An exercise needs at least one set.');
      return;
    }

    const target = exercise.sets.find((set) => set.id === setId);
    if (!target) return;

    const remove = () => {
      animateLayout();
      setExercises((current) => current.map((item, index) => index !== activeIndex
        ? item
        : { ...item, sets: item.sets.filter((set) => set.id !== setId) }));
      void workoutRepository.deleteWorkoutSet(session.id, exercise.id, setId);
      void Haptics.selectionAsync();
    };

    if (target.complete || target.weight || target.reps || target.seconds || target.rir) {
      Alert.alert('Remove set?', 'The values entered for this set will be deleted.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: remove },
      ]);
      return;
    }
    remove();
  }

  function openOverview() {
    animateLayout();
    setReviewDuration(() => (
      Math.max(1, Math.floor((Date.now() - workoutStartedAt.current) / 1000))
    ));
    setRestRemaining(null);
    setShowOverview(true);
  }

  function selectExercise(index: number) {
    animateLayout();
    setActiveIndex(index);
    setShowOverview(false);

  }

  async function startPlannedWorkout() {
    if (landing?.kind !== 'ready' || startingRef.current) return;
    startingRef.current = true; setStarting(true); setLoadError(null);
    try {
      const started = await workoutRepository.startWorkout(landing.day.id);
      setSession(started); setExercises(started.exercises); setActiveIndex(0);
      setRestRemaining(null); setShowOverview(false); setReviewDuration(null);
      loadedSessionId.current = started.id;
      workoutStartedAt.current = new Date(started.startedAt).getTime();
      setLanding({ kind: 'session', session: started });
      router.setParams({ sessionId: started.id });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not start workout. Please try again.');
    } finally { startingRef.current = false; setStarting(false); }
  }

  async function saveWorkout() {
    if (!session || savingRef.current) return;
    savingRef.current = true; setSaving(true);
    try {
      await workoutRepository.finishWorkout(session.id);
      const page = await loadWorkoutPage(workoutRepository);
      setLanding(page); setSession(null); setExercises([]);
      setShowOverview(false); setRestRemaining(null);
      router.setParams({ sessionId: undefined });
    } catch {
      Alert.alert('Could not save workout', 'Please try again.');
    } finally { savingRef.current = false; setSaving(false); }
  }

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (landing && landing.kind !== 'session') {
    const ready = landing.kind === 'ready' ? landing.day : null;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>TODAY’S WORKOUT</Text>
        <Text style={styles.screenTitle}>{ready ? ready.name : landing.kind === 'done' ? 'Today’s workout is done.' : 'No planned workout today.'}</Text>
        <Text style={styles.completionMessage}>{ready
          ? `${ready.exercises.length} exercises · ${ready.exercises.reduce((total, item) => total + (Number(item.sets) || 0), 0)} sets`
          : 'Feel free to start another workout.'}</Text>
        {ready && <View style={styles.overviewList}>{ready.exercises.map((item, index) => (
          <View key={item.id} style={styles.overviewRow}>
            <Text style={styles.overviewNumberText}>{index + 1}</Text>
            <View style={styles.overviewInfo}><Text style={styles.overviewName}>{item.name}</Text>
              <Text style={styles.pendingStatus}>{item.sets} sets · {item.target} {item.unit.toLowerCase()}</Text></View>
          </View>
        ))}</View>}
        {loadError && <Text accessibilityRole="alert" style={styles.errorText}>{loadError}</Text>}
        {ready && <Pressable accessibilityRole="button" disabled={starting} onPress={() => void startPlannedWorkout()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{starting ? 'STARTING…' : 'START WORKOUT'}</Text>
        </Pressable>}
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/splits')} style={ready ? styles.textButton : styles.primaryButton}>
          <Text style={ready ? styles.textButtonLabel : styles.primaryButtonText}>{ready ? 'CHOOSE ANOTHER WORKOUT' : 'START ANOTHER WORKOUT'}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (loadError || !session || !exercise) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{loadError ?? 'No workout exercises found.'}</Text>
        <Pressable onPress={() => router.replace('/splits')} style={styles.textButton}><Text style={styles.textButtonLabel}>BACK TO SPLITS</Text></Pressable>
      </View>
    );
  }

  if (showOverview) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>WORKOUT OVERVIEW</Text>
        <Text style={styles.screenTitle}>{session.workoutName}</Text>
        <Text style={styles.completionMessage}>{completedExerciseCount} of {exercises.length} exercises complete.</Text>

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

        <Pressable accessibilityRole="button" disabled={saving} onPress={saveWorkout} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{saving ? 'SAVING…' : 'FINISH & SAVE WORKOUT'}</Text>
        </Pressable>
        <Pressable onPress={() => setShowOverview(false)} style={styles.textButton}>
          <Text style={styles.textButtonLabel}>BACK TO WORKOUT</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={styles.page}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((activeIndex + 1) / exercises.length) * 100}%` }]} />
      </View>

      {restRemaining !== null && (
        <View style={styles.timerCard}>
          <View>
            <Text style={styles.timerLabel}>REST TIMER</Text>
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
          <Text style={styles.restDefault}>REST {formatTimer(restSeconds)}</Text>
        </View>
        {exercise.lastPerformance?.trim() &&
          !/^(no previous performance|no pr yet|previous best:\s*(no pr yet)?)$/i.test(exercise.lastPerformance.trim()) && (
            <Text style={styles.lastPerformance}>{exercise.lastPerformance}</Text>
          )}
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
          <View style={styles.removeColumn} />
        </View>

        {exercise.sets.map((set, index) => {
          const previousSet = exercise.previousSets?.[index];
          const isCurrentSet = !set.complete && exercise.sets.find(item => !item.complete)?.id === set.id;
          return (
          <View key={set.id} style={styles.setGroup}>
            <View style={[styles.setRow, set.complete && styles.setRowComplete]}>
            <Text accessibilityLabel={'Set ' + (index + 1) + (isCurrentSet ? ', current set' : '')} style={[styles.setNumber, styles.setColumn, isCurrentSet && { color: colors.accent, fontSize: 24 }]}>{isCurrentSet ? '•' : index + 1}</Text>
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
                <Text style={[styles.checkButtonText, !set.complete && { color: colors.textMuted }]}>✓</Text>
              </Pressable>
            </Animated.View>
            <Pressable
              accessibilityLabel={'Remove set ' + (index + 1)}
              onPress={() => removeSet(set.id)}
              style={styles.removeSetButton}
            >
              <Text style={styles.removeSetText}>−</Text>
            </Pressable>
            </View>
            {previousSet && (
              <Text style={styles.previousSetText}>LAST: {formatPreviousSet(exercise, previousSet)}</Text>
            )}
          </View>
          );
        })}
      </View>

      <Pressable onPress={addSet} style={styles.addSetButton}>
        <Text style={styles.addSetText}>＋ ADD SET</Text>
      </Pressable>

      <View style={styles.exerciseDock}>
        <View style={styles.dockHeading}>
          <View accessibilityLabel={'Exercise ' + (activeIndex + 1) + ' of ' + exercises.length} style={styles.progressBadge}><Text style={styles.badgeText}>{activeIndex + 1}/{exercises.length}</Text></View>
          <View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.dockTitle}>{exercise.name}</Text><Text numberOfLines={1} style={styles.dockCaption}>{session.workoutName}</Text></View>
          <Pressable accessibilityRole="button" onPress={openOverview} style={styles.reviewButton}><Text style={styles.reviewText}>Overview</Text></Pressable>
        </View>
        <ExerciseSelector exercises={exercises} selected={activeIndex}
          onSelect={index => { setRestRemaining(null); selectExercise(index); }} />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  exerciseDock: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20, gap: 16 },
  dockHeading: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  progressBadge: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.accent, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  dockTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  dockCaption: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  exerciseChips: { gap: 10, paddingVertical: 2 },
  exerciseChip: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  exerciseChipActive: { backgroundColor: colors.checked, borderWidth: 1, borderColor: '#555555' },
  chipText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  reviewButton: { padding: 12, backgroundColor: colors.accentDark, borderRadius: 24 },
  reviewText: { color: colors.accent, fontWeight: '700', fontSize: 13 },


  screen: { flex: 1, backgroundColor: colors.background },
  centerState: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  page: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: 112,
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: typography.eyebrow,
  screenTitle: { color: colors.text, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -0.8 },
  progressText: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginTop: 8 },
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
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: colors.checked, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
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
  timerLabel: { color: colors.accent, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  timerValue: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 2 },
  timerActions: { flexDirection: 'row', gap: spacing.sm },
  timerButton: { borderWidth: 1, borderColor: colors.accent, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: 9 },
  timerButtonText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  exerciseHeader: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    borderRadius: 18,
  },
  exerciseName: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
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
  doneColumn: { width: 44 },
  removeColumn: { width: 28 },
  setGroup: { gap: 6 },
  setRow: {
    minHeight: 66,
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
  previousSetText: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.7, paddingLeft: 40 },
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
  checkButton: { width: 44, height: 44, backgroundColor: colors.checked, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  checkButtonComplete: { backgroundColor: '#219B55' },
  checkButtonText: { color: colors.text, fontSize: 17, fontWeight: '900' },
  removeSetButton: { width: 28, height: 42, alignItems: 'center', justifyContent: 'center' },
  removeSetText: { color: colors.textMuted, fontSize: 20, fontWeight: '500' },
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
