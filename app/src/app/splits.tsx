import { StyleSheet, Text } from 'react-native';
import { Card, PageShell, pageColors } from '@/components/page-shell';

export default function SplitsScreen() {
  return <PageShell title="Splits" description="Your training days and exercises will live here.">
    <Card title="Upper / Lower"><Text style={styles.text}>Upper A · Lower A · Upper B · Lower B</Text></Card>
    <Card title="Day builder"><Text style={styles.text}>Next: choose a split type, name each day, add exercises, and assign equipment and rep ranges.</Text></Card>
  </PageShell>;
}

const styles = StyleSheet.create({ text: { color: pageColors.muted, fontSize: 16, lineHeight: 23 } });
