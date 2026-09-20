import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/constants/theme";

const week = [
  { day: "M", complete: true },
  { day: "T", complete: true },
  { day: "W", complete: false },
  { day: "T", complete: true },
  { day: "F", complete: true },
  { day: "S", complete: false, today: true },
  { day: "S", complete: false },
];

const stats = [
  { label: "STREAK", value: "5", unit: "days" },
  { label: "VOLUME", value: "14.2K", unit: "lbs this week" },
  { label: "PR THIS WEEK", value: "3", unit: "exercises" },
];

const recentPRs = [
  {
    exercise: "Incline Bench Press",
    machine: "Machine #3 — Gold's Gym",
    old: "185",
    current: "195",
    detail: "lbs × 6",
  },
  {
    exercise: "Lateral Raise Machine",
    machine: "Machine #7 — Gold's Gym",
    old: "55",
    current: "60",
    detail: "lbs × 12",
  },
  {
    exercise: "Cable Tricep Pushdown",
    machine: "Station B — Gold's Gym",
    old: "120",
    current: "130",
    detail: "lbs × 10",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={styles.page}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>GOOD AFTERNOON</Text>
          <Text style={styles.greeting}>KIITE</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={styles.profile}
        >
          <Text style={styles.profileText}>K</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>THIS WEEK</Text>
        <View style={styles.weekRow}>
          {week.map((item, index) => (
            <View key={index} style={styles.dayColumn}>
              <View
                style={[
                  styles.dayBox,
                  item.complete && styles.dayBoxComplete,
                  item.today && styles.dayBoxToday,
                ]}
              >
                {item.complete && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text
                style={[styles.dayLabel, item.today && styles.dayLabelToday]}
              >
                {item.day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.workoutCard}>
        <View style={styles.workoutTopRow}>
          <Text style={styles.todayLabel}>TODAY</Text>
          <Text style={styles.daysAgo}>7 days ago</Text>
        </View>
        <Text style={styles.workoutTitle}>PUSH DAY</Text>
        <Text style={styles.exerciseGroups}>CHEST · SHOULDERS · TRICEPS</Text>

        <View style={styles.workoutNumbers}>
          <View style={styles.numberGroup}>
            <Text style={styles.number}>6</Text>
            <Text style={styles.numberLabel}>exercises</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.numberGroup}>
            <Text style={styles.number}>18</Text>
            <Text style={styles.numberLabel}>sets</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/workout")}
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.startButtonText}>START WORKOUT</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text numberOfLines={1} style={styles.statLabel}>
              {stat.label}
            </Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text numberOfLines={1} style={styles.statUnit}>
              {stat.unit}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>RECENT PRS</Text>
          <Pressable accessibilityRole="button">
            <Text style={styles.viewAll}>VIEW ALL →</Text>
          </Pressable>
        </View>

        <View style={styles.prList}>
          {recentPRs.map((pr) => (
            <View key={pr.exercise} style={styles.prRow}>
              <View style={styles.prNameGroup}>
                <Text numberOfLines={1} style={styles.prName}>
                  {pr.exercise}
                </Text>
                <Text numberOfLines={1} style={styles.prMachine}>
                  {pr.machine}
                </Text>
              </View>
              <View style={styles.prResult}>
                <Text style={styles.oldWeight}>{pr.old}</Text>
                <Text style={styles.newWeight}>{pr.current}</Text>
                <Text style={styles.prDetail}>{pr.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 48,
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: typography.eyebrow,
  greeting: { ...typography.heading, marginTop: 2 },
  profile: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: { color: colors.text, fontSize: 19, fontWeight: "800" },
  panel: {
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sectionTitle: typography.sectionTitle,
  weekRow: { flexDirection: "row", gap: spacing.sm },
  dayColumn: { flex: 1, alignItems: "center", gap: spacing.sm },
  dayBox: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRaised,
  },
  dayBoxComplete: { backgroundColor: colors.checked },
  dayBoxToday: { backgroundColor: colors.accent },
  checkmark: { color: colors.text, fontSize: 16, fontWeight: "700" },
  dayLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "600" },
  dayLabelToday: { color: colors.accent },
  workoutCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: "#100B0A",
    overflow: "hidden",
  },
  workoutTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todayLabel: {
    color: colors.accent,
    backgroundColor: colors.accentDark,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
  },
  daysAgo: { color: colors.textMuted, fontSize: 12 },
  workoutTitle: {
    color: colors.text,
    fontSize: 35,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: spacing.sm,
  },
  exerciseGroups: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
  },
  workoutNumbers: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginVertical: spacing.md,
  },
  numberGroup: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  number: { color: colors.text, fontSize: 29, fontWeight: "900" },
  numberLabel: { color: colors.textMuted, fontSize: 12 },
  divider: { width: 1, height: 28, backgroundColor: colors.border },
  startButton: {
    backgroundColor: colors.accent,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  pressed: { opacity: 0.78 },
  startButtonText: { color: colors.text, fontSize: 16, fontWeight: "900" },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    minHeight: 92,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statLabel: { ...typography.sectionTitle, fontSize: 8, letterSpacing: 1.5 },
  statValue: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 5,
  },
  statUnit: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
  recentSection: { gap: spacing.lg },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAll: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  prList: { gap: spacing.sm },
  prRow: {
    minHeight: 66,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  prNameGroup: { flex: 1, minWidth: 0 },
  prName: { color: colors.text, fontSize: 14, fontWeight: "500" },
  prMachine: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  prResult: { flexDirection: "row", alignItems: "baseline", gap: 7 },
  oldWeight: {
    color: colors.textSubtle,
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  newWeight: { color: colors.accent, fontSize: 17, fontWeight: "800" },
  prDetail: { color: colors.textMuted, fontSize: 9 },
});
