import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, PageShell, pageColors } from '@/components/page-shell';

type DraftSet = { id: number; weight: string; reps: string; rir: string };

export default function WorkoutScreen() {
  const [sets, setSets] = useState<DraftSet[]>([{ id: 1, weight: '', reps: '', rir: '' }]);

  function updateSet(id: number, field: keyof Omit<DraftSet, 'id'>, value: string) {
    setSets(current => current.map(set => set.id === id ? { ...set, [field]: value } : set));
  }

  function addSet() {
    setSets(current => [...current, { id: Math.max(...current.map(set => set.id)) + 1, weight: '', reps: '', rir: '' }]);
  }

  return <PageShell title="Workout" description="Upper A · Draft session">
    <Card title="Machine chest press">
      <Text style={styles.detail}>Gym machine · Target 8–12 reps</Text>
      <Text style={styles.detail}>Last session: available after history is connected</Text>
      {sets.map((set, index) => <View key={set.id} style={styles.setRow}>
        <Text style={styles.setNumber}>{index + 1}</Text>
        <TextInput accessibilityLabel={`Set ${index + 1} weight`} keyboardType="decimal-pad" placeholder="lb" placeholderTextColor="#778292" value={set.weight} onChangeText={value => updateSet(set.id, 'weight', value)} style={styles.input} />
        <TextInput accessibilityLabel={`Set ${index + 1} reps`} keyboardType="number-pad" placeholder="reps" placeholderTextColor="#778292" value={set.reps} onChangeText={value => updateSet(set.id, 'reps', value)} style={styles.input} />
        <TextInput accessibilityLabel={`Set ${index + 1} RIR`} keyboardType="number-pad" placeholder="RIR" placeholderTextColor="#778292" value={set.rir} onChangeText={value => updateSet(set.id, 'rir', value)} style={styles.input} />
        <Pressable accessibilityLabel={`Remove set ${index + 1}`} onPress={() => setSets(current => current.length > 1 ? current.filter(item => item.id !== set.id) : current)}><Text style={styles.remove}>×</Text></Pressable>
      </View>)}
      <Pressable onPress={addSet} style={styles.secondaryButton}><Text style={styles.secondaryText}>+ Add set</Text></Pressable>
    </Card>
    <Pressable onPress={() => Alert.alert('Draft workout', 'Saving to Supabase will be added when the schema and client connection are ready.')} style={styles.primaryButton}><Text style={styles.primaryText}>Save workout</Text></Pressable>
    <Text style={styles.note}>This is local UI state. Closing the app clears the draft.</Text>
  </PageShell>;
}

const styles = StyleSheet.create({
  detail: { color: pageColors.muted, fontSize: 14 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  setNumber: { color: pageColors.text, width: 20, fontWeight: '700' },
  input: { flex: 1, minWidth: 0, backgroundColor: '#29313d', color: pageColors.text, borderRadius: 9, padding: 10, fontSize: 15 },
  remove: { color: '#e6b75c', fontSize: 28, paddingHorizontal: 5 },
  secondaryButton: { padding: 12, alignItems: 'center' },
  secondaryText: { color: pageColors.accent, fontWeight: '700' },
  primaryButton: { backgroundColor: pageColors.accent, padding: 17, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#101319', fontSize: 16, fontWeight: '800' },
  note: { color: pageColors.muted, fontSize: 13 },
});
