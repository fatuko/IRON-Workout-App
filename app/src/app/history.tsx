import { StyleSheet, Text } from 'react-native';
import { Card, PageShell, pageColors } from '@/components/page-shell';

export default function HistoryScreen() {
  return <PageShell title="History" description="Review sessions and compare sets on a specific machine.">
    <Card title="No saved sessions yet"><Text style={styles.text}>Workout data will appear here after the Supabase write and read path is connected.</Text></Card>
  </PageShell>;
}

const styles = StyleSheet.create({ text: { color: pageColors.muted, fontSize: 16, lineHeight: 23 } });
