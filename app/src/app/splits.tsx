import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Alert, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, UIManager, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import { workoutRepository } from '@/repositories';
import { WEEKDAYS } from '@/types/workout';
import type { PlannedExercise, Weekday, WorkoutSplit, WorkoutTemplate } from '@/types/workout';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animateLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

const makeId = (prefix: string) => prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);

export default function SplitsScreen() {
  const router = useRouter();
  const [split, setSplit] = useState<WorkoutSplit | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [weekdayMenuId, setWeekdayMenuId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([workoutRepository.getActiveSplit(), workoutRepository.getWorkoutTemplates()])
      .then(([savedSplit, savedWorkouts]) => {
        if (!active) return;
        setSplit(savedSplit);
        setWorkouts(savedWorkouts);
      })
      .catch(() => active && setLoadError('Could not load workouts.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filteredWorkouts = workouts.filter((workout) => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return true;
    return workout.name.toLowerCase().includes(query) ||
      workout.exercises.some((exercise) => exercise.name.toLowerCase().includes(query));
  });

  const updateWorkout = (id: string, changes: Partial<WorkoutTemplate>) =>
    setWorkouts((current) => current.map((workout) => workout.id === id ? { ...workout, ...changes } : workout));

  const updateExercise = (workoutId: string, exerciseId: string, changes: Partial<PlannedExercise>) =>
    setWorkouts((current) => current.map((workout) => workout.id === workoutId ? {
      ...workout,
      exercises: workout.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, ...changes } : exercise),
    } : workout));

  async function saveWorkout(workout: WorkoutTemplate) {
    const saved = await workoutRepository.saveWorkoutTemplate(workout);
    setWorkouts((current) => current.map((item) => item.id === saved.id ? saved : item));
    setSplit(await workoutRepository.getActiveSplit());
  }

  async function addToSplit(workoutId: string) {
    if (!split) return;
    const usedDays = new Set(split.days.map((day) => day.workoutDay));
    const workoutDay = WEEKDAYS.find((day) => !usedDays.has(day)) ?? 'MONDAY';
    animateLayout();
    setSplit(await workoutRepository.addWorkoutToSplit(split.id, workoutId, workoutDay));
    setFilterQuery('');
  }

  async function removeFromSplit(splitDayId: string) {
    if (!split) return;
    await workoutRepository.deleteSplitDay(split.id, splitDayId);
    animateLayout();
    setSplit(await workoutRepository.getActiveSplit());
  }

  async function changeWeekday(splitDayId: string, workoutDay: Weekday) {
    if (!split) return;
    const saved = await workoutRepository.saveActiveSplit({
      ...split,
      days: split.days.map((day) => day.id === splitDayId ? { ...day, workoutDay } : day),
    });
    animateLayout();
    setSplit(saved);
    setWeekdayMenuId(null);
  }

  async function startWorkout(splitDayId: string) {
    try {
      const session = await workoutRepository.startWorkout(splitDayId);
      router.push({ pathname: '/workout', params: { sessionId: session.id } });
    } catch {
      Alert.alert('Could not start workout', 'Add at least one exercise and try again.');
    }
  }

  async function createWorkout() {
    const workout: WorkoutTemplate = {
      id: makeId('workout'),
      name: 'NEW WORKOUT',
      color: colors.accent,
      exercises: [],
    };
    await workoutRepository.saveWorkoutTemplate(workout);
    animateLayout();
    setWorkouts((current) => [...current, workout]);
    setExpandedId(workout.id);
    setEditingId(workout.id);
    setFilterQuery('');
  }

  function addExercise(workoutId: string) {
    const workout = workouts.find((item) => item.id === workoutId);
    if (!workout) return;
    updateWorkout(workoutId, {
      exercises: [...workout.exercises, {
        id: makeId('exercise'), name: 'New Exercise', sets: '3', target: '8–12', unit: 'REPS', pr: 'NO PR YET',
      }],
    });
  }

  function deleteWorkout(workoutId: string) {
    Alert.alert('Delete workout?', 'This also removes it from your active split.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await workoutRepository.deleteWorkoutTemplate(workoutId);
        animateLayout();
        setWorkouts((current) => current.filter((workout) => workout.id !== workoutId));
        setSplit(await workoutRepository.getActiveSplit());
      } },
    ]);
  }

  if (loading) return <View style={styles.centerState}><ActivityIndicator color={colors.accent} /></View>;
  if (loadError) return <View style={styles.centerState}><Text style={styles.muted}>{loadError}</Text></View>;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      style={styles.screen} contentContainerStyle={styles.page}>
      <View style={styles.sectionPanel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.currentTitle}>CURRENT SPLIT</Text>
        </View>

        <View style={styles.scheduleRow}>
        {WEEKDAYS.map((weekday) => {
          const scheduled = split?.days.filter((day) => day.workoutDay === weekday) ?? [];
          return <View key={weekday} style={styles.scheduleDay}>
            <Text style={[styles.scheduleLabel, scheduled.length > 0 && styles.scheduleLabelActive]}>{weekday.slice(0, 3)}</Text>
            <View style={styles.scheduleMarkers}>
              {scheduled.length === 0 ? <View style={styles.scheduleDotEmpty} /> : scheduled.map((day) =>
                <View key={day.id} style={styles.scheduleDot} />)}
            </View>
          </View>;
        })}
      </View>

      <View style={styles.splitList}>
        {split?.days.map((day) => (
          <View key={day.id} style={styles.splitRow}>
            <View style={styles.splitInfo}>
              <Text style={styles.splitName}>{day.name}</Text>
              <Text style={styles.splitMeta}>{day.exercises.length} EXERCISES</Text>
            </View>
            <Pressable onPress={() => { animateLayout(); setWeekdayMenuId((current) => current === day.id ? null : day.id); }} style={styles.weekdayButton}>
              <Text style={styles.weekdayButtonText}>{day.workoutDay.slice(0, 3)}</Text>
              <Text style={styles.chevron}>⌄</Text>
            </Pressable>
            <Pressable accessibilityLabel={'Start ' + day.name} onPress={() => void startWorkout(day.id)} style={styles.playButton}>
              <SymbolView name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={17} tintColor={colors.text} />
            </Pressable>
            <Pressable accessibilityLabel={'Remove ' + day.name + ' from split'} onPress={() => void removeFromSplit(day.id)} style={styles.removeButton}>
              <Text style={styles.removeText}>×</Text>
            </Pressable>
            {weekdayMenuId === day.id && <View style={styles.weekdayMenu}>
              {WEEKDAYS.map((weekday) => <Pressable key={weekday} onPress={() => void changeWeekday(day.id, weekday)} style={styles.weekdayOption}>
                <Text style={[styles.weekdayOptionText, weekday === day.workoutDay && styles.selectedText]}>{weekday}</Text>
              </Pressable>)}
            </View>}
          </View>
        ))}
          {split?.days.length === 0 && <Text style={styles.emptyText}>ADD WORKOUTS FROM YOUR LIBRARY</Text>}
        </View>
      </View>

      <View style={styles.libraryHeader}>
        <Text style={styles.libraryTitle}>WORKOUT LIBRARY</Text>
      </View>

      <View style={styles.searchBar}>
        <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={18} tintColor={colors.textMuted} />
        <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setFilterQuery}
          placeholder="Search workouts..." placeholderTextColor={colors.textSubtle}
          style={styles.searchInput} value={filterQuery} />
      </View>

      <View style={styles.libraryList}>
        {filteredWorkouts.map((workout) => {
          const expanded = expandedId === workout.id;
          const editing = editingId === workout.id;
          const inSplit = Boolean(split?.days.some((day) => day.workoutId === workout.id));
          const totalSets = workout.exercises.reduce((total, exercise) => total + (Number(exercise.sets) || 0), 0);
          return <View key={workout.id} style={styles.workoutCard}>
            <SymbolView name={{ ios: 'dumbbell.fill', android: 'fitness_center', web: 'fitness_center' }}
              size={76} tintColor={colors.accent} style={styles.watermark} />
            <Pressable onPress={() => { animateLayout(); setExpandedId(expanded ? null : workout.id); setFilterQuery(''); }} style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                {editing ? <TextInput autoCapitalize="characters" onChangeText={(name) => updateWorkout(workout.id, { name })}
                  style={styles.nameInput} value={workout.name} /> : <Text style={styles.workoutName}>{workout.name}</Text>}
                <Text style={styles.workoutMeta}>{workout.exercises.length} EXERCISES · {totalSets} SETS</Text>
              </View>
              <Pressable onPress={() => {
                animateLayout();
                if (editing) void saveWorkout(workout);
                setEditingId(editing ? null : workout.id);
                setExpandedId(workout.id);
              }} style={[styles.editButton, editing && styles.editButtonActive]}>
                <Text style={[styles.editText, editing && styles.editTextActive]}>{editing ? 'DONE' : 'EDIT'}</Text>
              </Pressable>
              <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>⌄</Text>
            </Pressable>

            {expanded && <View style={styles.expandedContent}>
              {workout.exercises.map((exercise, index) => <View key={exercise.id} style={styles.exerciseRow}>
                <Text style={styles.exerciseNumber}>{String(index + 1).padStart(2, '0')}</Text>
                {editing ? <TextInput onChangeText={(name) => updateExercise(workout.id, exercise.id, { name })}
                  style={styles.exerciseInput} value={exercise.name} /> : <Text style={styles.exerciseName}>{exercise.name}</Text>}
                {editing ? <View style={styles.planInputs}>
                  <TextInput keyboardType="number-pad" onChangeText={(sets) => updateExercise(workout.id, exercise.id, { sets })} style={styles.smallInput} value={exercise.sets} />
                  <Text style={styles.muted}>×</Text>
                  <TextInput onChangeText={(target) => updateExercise(workout.id, exercise.id, { target })} style={styles.targetInput} value={exercise.target} />
                  <Pressable onPress={() => updateExercise(workout.id, exercise.id, { unit: exercise.unit === 'REPS' ? 'SEC' : 'REPS' })} style={styles.unitButton}>
                    <Text style={styles.unitText}>{exercise.unit}</Text>
                  </Pressable>
                </View> : <Text style={styles.exercisePlan}>{exercise.sets} × {exercise.target} {exercise.unit}</Text>}
              </View>)}
              {editing && <>
                <Pressable onPress={() => addExercise(workout.id)} style={styles.secondaryButton}><Text style={styles.secondaryText}>＋ ADD EXERCISE</Text></Pressable>
                <Pressable onPress={() => deleteWorkout(workout.id)} style={styles.deleteButton}><Text style={styles.deleteText}>DELETE WORKOUT</Text></Pressable>
              </>}
              {!inSplit && !editing && <Pressable onPress={() => void addToSplit(workout.id)} style={styles.addToSplitButton}>
                <Text style={styles.addToSplitText}>＋ ADD TO SPLIT</Text>
              </Pressable>}
              {inSplit && !editing && <Text style={styles.inSplitText}>IN YOUR SPLIT</Text>}
            </View>}
          </View>;
        })}
        {filteredWorkouts.length === 0 && <Text style={styles.emptyText}>NO MATCHING WORKOUTS</Text>}
      </View>

      <Pressable onPress={() => void createWorkout()} style={styles.createButton}>
        <Text style={styles.createButtonText}>＋ CREATE WORKOUT</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centerState: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  page: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: 112, gap: spacing.xl, backgroundColor: colors.background },
  sectionPanel: { padding: spacing.xl, gap: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  currentTitle: { color: colors.text, fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -0.7 },
  libraryHeader: { marginTop: spacing.sm },
  libraryTitle: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.2 },
  scheduleRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  scheduleDay: { flex: 1, alignItems: 'center', gap: 10 },
  scheduleLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800' },
  scheduleLabelActive: { color: colors.text },
  scheduleMarkers: { minHeight: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3 },
  scheduleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  scheduleDotEmpty: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  splitList: { gap: spacing.md },
  splitRow: { position: 'relative', minHeight: 82, paddingLeft: spacing.lg, paddingRight: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  splitInfo: { flex: 1, minWidth: 0, gap: 4 },
  splitName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  splitMeta: { color: colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  weekdayButton: { minWidth: 54, height: 34, paddingHorizontal: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  weekdayButtonText: { color: colors.text, fontSize: 9, fontWeight: '800' },
  chevron: { color: colors.textMuted, fontSize: 18 },
  chevronExpanded: { transform: [{ rotate: '180deg' }] },
  playButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  removeButton: { width: 24, height: 34, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.textMuted, fontSize: 20 },
  weekdayMenu: { position: 'absolute', zIndex: 4, right: 42, top: 58, width: 126, padding: 4, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surfaceRaised },
  weekdayOption: { minHeight: 34, paddingHorizontal: spacing.sm, justifyContent: 'center' },
  weekdayOptionText: { color: colors.textMuted, fontSize: 9, fontWeight: '800' },
  selectedText: { color: colors.accent },
  searchBar: { minHeight: 54, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  libraryList: { gap: spacing.lg },
  workoutCard: { position: 'relative', borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: spacing.xl, overflow: 'hidden', backgroundColor: colors.surface },
  watermark: { position: 'absolute', right: -10, top: 4, opacity: 0.05, transform: [{ rotate: '-12deg' }] },
  cardHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardInfo: { flex: 1, minWidth: 0, gap: 5 },
  workoutName: { color: colors.text, fontSize: 24, fontWeight: '900' },
  workoutMeta: { color: colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  nameInput: { color: colors.text, fontSize: 20, fontWeight: '900', borderBottomWidth: 1, borderBottomColor: colors.textSubtle },
  editButton: { minWidth: 54, height: 34, borderWidth: 1, borderColor: colors.accent, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  editButtonActive: { backgroundColor: colors.accent },
  editText: { color: colors.accent, fontSize: 9, fontWeight: '900' },
  editTextActive: { color: colors.text },
  expandedContent: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  exerciseRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  exerciseNumber: { width: 22, color: colors.textMuted, fontSize: 9, fontWeight: '800' },
  exerciseName: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '700' },
  exerciseInput: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: colors.textSubtle },
  exercisePlan: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  planInputs: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallInput: { width: 30, height: 32, borderRadius: 8, backgroundColor: colors.background, color: colors.text, textAlign: 'center' },
  targetInput: { width: 48, height: 32, borderRadius: 8, backgroundColor: colors.background, color: colors.text, textAlign: 'center' },
  unitButton: { minWidth: 40, height: 32, borderRadius: 8, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  unitText: { color: colors.text, fontSize: 8, fontWeight: '900' },
  secondaryButton: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  secondaryText: { color: colors.text, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  deleteButton: { minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  addToSplitButton: { minHeight: 44, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  addToSplitText: { color: colors.text, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  inSplitText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.4, textAlign: 'center', paddingTop: spacing.sm },
  createButton: { minHeight: 60, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  createButtonText: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  emptyText: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textAlign: 'center', padding: spacing.xl },
  muted: { color: colors.textMuted },
});
