import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

type TargetUnit = 'REPS' | 'SEC';
type Exercise = { id: string; name: string; sets: string; target: string; unit: TargetUnit; pr: string };
type SplitDay = {
  id: string;
  name: string;
  workoutDay: string;
  color: string;
  exercises: Exercise[];
};

const palette = [
  { name: 'Red', color: '#FF3D00' },
  { name: 'Orange', color: '#FF8A00' },
  { name: 'Yellow', color: '#FFD000' },
  { name: 'Green', color: '#4ECB71' },
  { name: 'Blue', color: '#368DFF' },
  { name: 'Purple', color: '#9B6DFF' },
  { name: 'Pink', color: '#FF5C9A' },
];

const starterDays: SplitDay[] = [
  {
    id: 'push', name: 'PUSH DAY', workoutDay: 'MONDAY',
    color: palette[0].color,
    exercises: [
      { id: 'bench', name: 'Incline Bench Press', sets: '3', target: '6–8', unit: 'REPS', pr: '195 LB × 6' },
      { id: 'press', name: 'Machine Chest Press', sets: '3', target: '8–10', unit: 'REPS', pr: '160 LB × 8' },
      { id: 'raise', name: 'Cable Lateral Raise', sets: '3', target: '10–15', unit: 'REPS', pr: '30 LB × 12' },
    ],
  },
  {
    id: 'pull', name: 'PULL DAY', workoutDay: 'TUESDAY',
    color: palette[5].color,
    exercises: [
      { id: 'pulldown', name: 'Lat Pulldown', sets: '3', target: '6–10', unit: 'REPS', pr: '150 LB × 8' },
      { id: 'row', name: 'Chest-Supported Row', sets: '3', target: '8–12', unit: 'REPS', pr: '135 LB × 10' },
      { id: 'curl', name: 'Preacher Curl', sets: '3', target: '8–12', unit: 'REPS', pr: '65 LB × 9' },
    ],
  },
  {
    id: 'legs', name: 'LEGS DAY', workoutDay: 'WEDNESDAY',
    color: palette[4].color,
    exercises: [
      { id: 'squat', name: 'Hack Squat', sets: '4', target: '6–10', unit: 'REPS', pr: '270 LB × 7' },
      { id: 'leg-curl', name: 'Seated Leg Curl', sets: '3', target: '8–12', unit: 'REPS', pr: '120 LB × 10' },
      { id: 'calf', name: 'Standing Calf Raise', sets: '4', target: '10–15', unit: 'REPS', pr: '180 LB × 12' },
    ],
  },
];

const makeId = (prefix: string) => prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);

export default function SplitsScreen() {
  const router = useRouter();
  const [days, setDays] = useState(starterDays);
  const [expandedId, setExpandedId] = useState<string | null>('push');
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateDay = (id: string, changes: Partial<SplitDay>) =>
    setDays((current) => current.map((day) => day.id === id ? { ...day, ...changes } : day));

  const updateExercise = (dayId: string, exerciseId: string, changes: Partial<Exercise>) =>
    setDays((current) => current.map((day) => day.id === dayId ? {
      ...day,
      exercises: day.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, ...changes } : exercise),
    } : day));

  function addExercise(dayId: string) {
    setDays((current) => current.map((day) => day.id === dayId ? {
      ...day,
      exercises: [...day.exercises, {
        id: makeId('exercise'), name: 'New Exercise',
        sets: '3', target: '8–12', unit: 'REPS', pr: 'NO PR YET',
      }],
    } : day));
  }

  function addDay() {
    const option = palette[days.length % palette.length];
    const id = makeId('day');
    setDays((current) => [...current, {
      id, name: 'NEW DAY', workoutDay: 'THURSDAY', color: option.color, exercises: [],
    }]);
    setExpandedId(id);
    setEditingId(id);
  }

  function deleteDay(id: string) {
    Alert.alert('Delete split day?', 'This removes the day and its planned exercises.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setDays((current) => current.filter((day) => day.id !== id));
        setExpandedId((current) => current === id ? null : current);
        setEditingId((current) => current === id ? null : current);
      } },
    ]);
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false} style={styles.screen} contentContainerStyle={styles.page}>
      <Text style={styles.pageTitle}>WORKOUT SPLITS</Text>

      <View style={styles.dayList}>
        {days.map((day) => {
          const expanded = expandedId === day.id;
          const editing = editingId === day.id;
          return (
            <View key={day.id} style={[styles.card, { borderColor: day.color }]}>
              <View style={styles.cardHeader}>
                <Pressable onPress={() => setExpandedId(expanded ? null : day.id)} style={styles.dayInfo}>
                  {editing ? <>
                    <TextInput accessibilityLabel="Workout day" autoCapitalize="characters"
                      onChangeText={(workoutDay) => updateDay(day.id, { workoutDay })}
                      style={styles.workoutDayInput} value={day.workoutDay} />
                    <TextInput accessibilityLabel="Split day name" autoCapitalize="characters"
                      onChangeText={(name) => updateDay(day.id, { name })} style={styles.titleInput} value={day.name} />
                  </> : <>
                    <Text style={styles.workoutDay}>{day.workoutDay}</Text>
                    <Text style={styles.dayTitle}>{day.name}</Text>
                  </>}
                  <Text style={styles.count}>{day.exercises.length} {day.exercises.length === 1 ? 'exercise' : 'exercises'}</Text>
                </Pressable>
                <View style={styles.headerActions}>
                  <Pressable onPress={() => { setEditingId(editing ? null : day.id); setExpandedId(day.id); }}
                    style={[styles.editButton, editing && styles.editButtonActive]}>
                    <Text style={[styles.editText, editing && styles.editTextActive]}>{editing ? 'DONE' : 'EDIT'}</Text>
                  </Pressable>
                  <Pressable onPress={() => setExpandedId(expanded ? null : day.id)} style={styles.expandButton}>
                    <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>⌄</Text>
                  </Pressable>
                </View>
              </View>

              {editing && <View style={styles.colorEditor}>
                <Text style={styles.label}>DAY COLOR</Text>
                <View style={styles.palette}>{palette.map((option) =>
                  <Pressable key={option.name} accessibilityLabel={'Use ' + option.name}
                    onPress={() => updateDay(day.id, { color: option.color })}
                    style={[styles.swatch, { backgroundColor: option.color }, option.color === day.color && styles.swatchSelected]}>
                    {option.color === day.color && <Text style={styles.check}>✓</Text>}
                  </Pressable>)}</View>
              </View>}

              {expanded && <View style={styles.exerciseList}>
                {day.exercises.length === 0 && <Text style={styles.empty}>No exercises yet. Add one below.</Text>}
                {day.exercises.map((exercise, index) => <View key={exercise.id} style={styles.exerciseRow}>
                  <Text style={styles.exerciseNumber}>{String(index + 1).padStart(2, '0')}</Text>
                  <View style={styles.exerciseDetails}>{editing ? <>
                    <TextInput accessibilityLabel="Exercise name" onChangeText={(name) => updateExercise(day.id, exercise.id, { name })}
                      style={styles.exerciseInput} value={exercise.name} />
                  </> : <Text style={styles.exerciseName}>{exercise.name}</Text>}</View>
                  <View style={styles.plan}>{editing ? <View style={styles.planInputs}>
                    <TextInput accessibilityLabel="Sets" keyboardType="number-pad" onChangeText={(sets) => updateExercise(day.id, exercise.id, { sets })}
                      style={styles.setInput} value={exercise.sets} />
                    <Text style={styles.times}>×</Text>
                    <TextInput accessibilityLabel={exercise.unit === 'REPS' ? 'Rep range' : 'Seconds'}
                      keyboardType={exercise.unit === 'SEC' ? 'number-pad' : 'default'}
                      onChangeText={(target) => updateExercise(day.id, exercise.id, { target })}
                      style={styles.repInput} value={exercise.target} />
                    <Pressable accessibilityLabel="Switch between reps and seconds"
                      onPress={() => updateExercise(day.id, exercise.id, {
                        unit: exercise.unit === 'REPS' ? 'SEC' : 'REPS',
                        target: exercise.unit === 'REPS' ? '30' : '8–12',
                      })} style={styles.unitButton}>
                      <Text style={styles.unitText}>{exercise.unit}</Text>
                    </Pressable>
                  </View> : <Text style={styles.prescription}>{exercise.sets} SETS × {exercise.target} {exercise.unit}</Text>}
                    <Text style={styles.pr}>PR {exercise.pr}</Text>
                  </View>
                  {editing && <Pressable accessibilityLabel={'Remove ' + exercise.name} onPress={() => updateDay(day.id, {
                    exercises: day.exercises.filter((item) => item.id !== exercise.id),
                  })} style={styles.removeButton}><Text style={styles.removeText}>×</Text></Pressable>}
                </View>)}
                {editing ? <View style={styles.editActions}>
                  <Pressable onPress={() => addExercise(day.id)} style={styles.outlineButton}>
                    <Text style={styles.outlineText}>＋ ADD EXERCISE</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteDay(day.id)} style={styles.deleteButton}><Text style={styles.deleteText}>DELETE DAY</Text></Pressable>
                </View> : day.exercises.length > 0 && <Pressable onPress={() => router.push('/workout')}
                  style={styles.startButton}><Text style={styles.startText}>START THIS DAY</Text></Pressable>}
              </View>}
            </View>
          );
        })}
      </View>

      <Pressable onPress={addDay} style={styles.addDayButton}><Text style={styles.addDayText}>＋ ADD SPLIT DAY</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 64, gap: spacing.xl, backgroundColor: colors.background },
  pageTitle: { color: colors.text, fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -0.8 },
  dayList: { gap: spacing.lg },
  card: { borderWidth: 1, borderRadius: 8, padding: spacing.lg, overflow: 'hidden', backgroundColor: colors.surface },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayInfo: { flex: 1, minWidth: 0, gap: 5 },
  workoutDay: { color: colors.text, fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  workoutDayInput: { color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.textSubtle, fontSize: 10, fontWeight: '800', letterSpacing: 1.8, paddingVertical: 3 },
  dayTitle: { color: colors.text, fontSize: 25, lineHeight: 29, fontWeight: '900', letterSpacing: -0.5 },
  titleInput: { color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.textSubtle, fontSize: 24, lineHeight: 29, fontWeight: '900', paddingVertical: 2 },
  count: { color: colors.textMuted, fontSize: 9, letterSpacing: 1, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editButton: { minWidth: 56, height: 34, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  editButtonActive: { backgroundColor: colors.text },
  editText: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  editTextActive: { color: colors.black },
  expandButton: { width: 24, height: 40, alignItems: 'center', justifyContent: 'center' },
  chevron: { color: colors.textMuted, fontSize: 23, lineHeight: 24 },
  chevronExpanded: { transform: [{ rotate: '180deg' }] },
  colorEditor: { borderTopWidth: 1, borderTopColor: colors.textSubtle, marginTop: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  label: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 32, height: 32, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatchSelected: { borderColor: colors.text },
  check: { color: colors.black, fontWeight: '900', fontSize: 16 },
  exerciseList: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  empty: { color: colors.textMuted, fontSize: 12, paddingVertical: spacing.md },
  exerciseRow: { minHeight: 64, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  exerciseNumber: { color: colors.textMuted, width: 22, fontSize: 9, fontWeight: '800' },
  exerciseDetails: { flex: 1, minWidth: 0, gap: 4 },
  exerciseName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  exerciseInput: { color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.textSubtle, fontSize: 13, fontWeight: '700', paddingVertical: 3 },
  plan: { alignItems: 'flex-end', gap: 5 },
  prescription: { color: colors.text, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  pr: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  planInputs: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  setInput: { width: 30, height: 32, color: colors.text, backgroundColor: 'rgba(0,0,0,0.35)', textAlign: 'center', padding: 0 },
  times: { color: colors.textMuted },
  repInput: { width: 50, height: 32, color: colors.text, backgroundColor: 'rgba(0,0,0,0.35)', textAlign: 'center', padding: 0 },
  unitButton: { height: 32, minWidth: 40, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unitText: { color: colors.text, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  removeButton: { width: 24, height: 32, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.textMuted, fontSize: 22 },
  editActions: { gap: spacing.sm, marginTop: spacing.sm },
  outlineButton: { height: 44, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  outlineText: { color: colors.text, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  deleteButton: { alignSelf: 'center', padding: spacing.sm },
  deleteText: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  startButton: { height: 46, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  startText: { color: colors.black, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  addDayButton: { minHeight: 64, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  addDayText: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2.5 },
});
