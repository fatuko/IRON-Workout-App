import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

export const pageColors = {
  text: colors.text,
  muted: colors.textMuted,
  accent: colors.accent,
};

export function PageShell({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <ScrollView
    keyboardShouldPersistTaps="handled"
    style={styles.screen}
    contentContainerStyle={styles.page}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {children}
  </ScrollView>;
}

export function Card({ title, children }: { title: string; children?: ReactNode }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 48 },
  title: { color: pageColors.text, fontSize: 30, fontWeight: '800' },
  description: { color: pageColors.muted, fontSize: 16, lineHeight: 23 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  cardTitle: { color: pageColors.text, fontSize: 19, fontWeight: '700' },
});
