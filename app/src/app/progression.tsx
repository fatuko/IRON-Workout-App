import { StyleSheet, Text } from 'react-native';
import { Card, PageShell, pageColors } from '@/components/page-shell';

export default function ProgressionScreen() {
  return <PageShell title="Progression" description="Track weight, reps, and estimated 1RM over time.">
    <Card title="Trends start with logged sets"><Text style={styles.text}>Exercise and muscle-group charts will use your saved workout history.</Text></Card>
  </PageShell>;
}

const styles = StyleSheet.create({ text: { color: pageColors.muted, fontSize: 16, lineHeight: 23 } });
