import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

type SetField = 'weight' | 'reps' | 'rir';
type WorkoutSet = {
  id: number;
  weight: string;
  reps: string;
  rir: string;
  complete: boolean;
};
type Exercise = {
  id: string;
  name: string;
  repRange: string;
  lastPerformance: string;
  restSeconds: number;
  sets: WorkoutSet[];
};

const makeSets = (count: number): WorkoutSet[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    weight: '',
    reps: '',
    rir: '',
    complete: false,
  }));

const initialExercises: Exercise[] = [
  {
    id: 'incline-press',
    name: 'INCLINE CHEST PRESS',
    repRange: '8–12 reps',
    lastPerformance: 'Last: 185 lb × 8, 8, 7',
    restSeconds: 180,
    sets: makeSets(3),
  },
  {
    id: 'shoulder-press',
    name: 'SHOULDER PRESS',
    repRange: '6–10 reps',
    lastPerformance: 'Last: 90 lb × 10, 9, 8',
    restSeconds: 180,
    sets: makeSets(3),
  },
  {
    id: 'cable-fly',
    name: 'CABLE FLY',
    repRange: '10–15 reps',
    lastPerformance: 'Last: 35 lb × 14, 12, 11',
    restSeconds: 120,
    sets: makeSets(3),
  },
  {
    id: 'lateral-raise',
    name: 'LATERAL RAISE',
    repRange: '12–20 reps',
    lastPerformance: 'Last: 60 lb × 15, 13, 12',
    restSeconds: 120,
    sets: makeSets(3),
  },
  {
    id: 'tricep-pushdown',
    name: 'TRICEP PUSHDOWN',
    repRange: '10–15 reps',
    lastPerformance: 'Last: 130 lb × 12, 11, 10',
    restSeconds: 120,
    sets: makeSets(3),
  },
  {
    id: 'overhead-extension',
    name: 'OVERHEAD EXTENSION',
    repRange: '10–15 reps',
    lastPerformance: 'Last: 50 lb × 14, 12, 11',
    restSeconds: 120,
    sets: makeSets(3),
  },
];

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getExerciseStatus(exercise: Exercise) {
  const completed = exercise.sets.filter((set) => set.complete).length;
  if (completed === 0) return 'NOT STARTED';
  if (completed === exercise.sets.length) return 'COMPLETED';
  return 'IN PROGRESS';
}

export default function WorkoutScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState(initialExercises);
  const [activeIndex, setActiveIndex] = useState(0);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const exercise = exercises[activeIndex];

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

  function updateSet(setId: number, field: SetField, value: string) {
    setExercises((current) => current.map((item, index) => (
      index !== activeIndex
        ? item
        : {
            ...item,
            sets: item.sets.map((set) => (
              set.id === setId ? { ...set, [field]: value, complete: false } : set
            )),
          }
    )));
  }

  function toggleSet(setId: number) {
    const target = exercise.sets.find((set) => set.id === setId);
    if (!target) return;

    if (!target.complete && (!target.weight || !target.reps || !target.rir)) {
      Alert.alert('Complete the set', 'Enter weight, reps, and RIR before marking this set done.');
      return;
    }

    setExercises((current) => current.map((item, index) => (
      index !== activeIndex
        ? item
        : {
            ...item,
            sets: item.sets.map((set) => (
              set.id === setId ? { ...set, complete: !set.complete } : set
            )),
          }
    )));

    if (!target.complete) setRestRemaining(exercise.restSeconds);
  }

  function addSet() {
    setExercises((current) => current.map((item, index) => (
      index !== activeIndex
        ? item
        : {
            ...item,
            sets: [
              ...item.sets,
              {
                id: Math.max(...item.sets.map((set) => set.id)) + 1,
                weight: '',
                reps: '',
                rir: '',
                complete: false,
              },
            ],
          }
    )));
  }

  function advanceExercise() {
    const hasIncompleteSets = exercise.sets.some((set) => !set.complete);
    const advance = () => {
      setRestRemaining(null);
      if (activeIndex === exercises.length - 1) setShowReview(true);
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

  function saveWorkout() {
    Alert.alert('Workout saved', 'Supabase persistence will replace this prototype action.', [
      { text: 'Done', onPress: () => router.replace('/') },
    ]);
  }

  if (showReview) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>WORKOUT REVIEW</Text>
        <Text style={styles.screenTitle}>PUSH DAY</Text>

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
            <Text style={styles.screenTitle}>PUSH DAY</Text>
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

        <Pressable onPress={() => setShowReview(true)} style={styles.outlineButton}>
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
          <Text style={styles.screenTitle}>PUSH DAY</Text>
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
          <Text style={styles.columnLabel}>WEIGHT</Text>
          <Text style={styles.columnLabel}>REPS</Text>
          <Text style={styles.columnLabel}>RIR</Text>
          <View style={styles.doneColumn} />
        </View>

        {exercise.sets.map((set, index) => (
          <View key={set.id} style={[styles.setRow, set.complete && styles.setRowComplete]}>
            <Text style={[styles.setNumber, styles.setColumn]}>{String(index + 1).padStart(2, '0')}</Text>
            <TextInput
              accessibilityLabel={`Set ${index + 1} weight`}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={colors.textSubtle}
              value={set.weight}
              onChangeText={(value) => updateSet(set.id, 'weight', value)}
              style={styles.input}
            />
            <TextInput
              accessibilityLabel={`Set ${index + 1} reps`}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor={colors.textSubtle}
              value={set.reps}
              onChangeText={(value) => updateSet(set.id, 'reps', value)}
              style={styles.input}
            />
            <TextInput
              accessibilityLabel={`Set ${index + 1} RIR`}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor={colors.textSubtle}
              value={set.rir}
              onChangeText={(value) => updateSet(set.id, 'rir', value)}
              style={styles.input}
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: set.complete }}
              accessibilityLabel={`Complete set ${index + 1}`}
              onPress={() => toggleSet(set.id)}
              style={[styles.checkButton, set.complete && styles.checkButtonComplete]}>
              <Text style={styles.checkButtonText}>{set.complete ? '✓' : ''}</Text>
            </Pressable>
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

      <Text style={styles.prototypeNote}>Draft data is stored in memory for this prototype.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 56,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: typography.eyebrow,
  screenTitle: { color: colors.text, fontSize: 35, fontWeight: '900', marginTop: 4 },
  progressText: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 5 },
  overviewButton: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
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
  },
  timerFinished: { backgroundColor: colors.surface },
  timerLabel: { color: colors.accent, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  timerValue: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 2 },
  timerActions: { flexDirection: 'row', gap: spacing.sm },
  timerButton: { borderWidth: 1, borderColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: 9 },
  timerButtonText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  exerciseHeader: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
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
  },
  checkButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  previousText: { color: colors.text, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  nextButton: {
    flex: 1.6,
    minHeight: 54,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  disabled: { opacity: 0.3 },
  prototypeNote: { color: colors.textMuted, fontSize: 10, textAlign: 'center' },
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
  },
  overviewRowActive: { borderColor: colors.accent },
  overviewNumber: {
    width: 34,
    height: 34,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  primaryButtonText: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  outlineButton: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
});
