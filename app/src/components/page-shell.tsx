import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export const pageColors = { text: '#f5f7fa', muted: '#aeb8c6', accent: '#e6b75c' };

export function PageShell({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {children}
  </ScrollView>;
}

export function Card({ title, children }: { title: string; children?: ReactNode }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  page: { padding: 24, gap: 16, paddingBottom: 48 },
  title: { color: pageColors.text, fontSize: 30, fontWeight: '800' },
  description: { color: pageColors.muted, fontSize: 16, lineHeight: 23 },
  card: { backgroundColor: '#191e27', padding: 18, borderRadius: 16, gap: 10 },
  cardTitle: { color: pageColors.text, fontSize: 19, fontWeight: '700' },
});
