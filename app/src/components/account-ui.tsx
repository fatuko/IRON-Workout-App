import { useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

export function AccountPage({ eyebrow = 'IRON / YOUR TRAINING', title, subtitle, children }: { eyebrow?: string; title: string; subtitle: string; children: ReactNode }) {
  return <SafeAreaView style={ui.screen}><KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>
      <View style={ui.brandLine} /><Text style={ui.eyebrow}>{eyebrow}</Text>
      <Text style={ui.title}>{title}</Text><Text style={ui.subtitle}>{subtitle}</Text>
      <View style={ui.form}>{children}</View>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}

export function Field({ label, password, ...props }: TextInputProps & { label: string; password?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <View style={ui.field}><Text style={ui.label}>{label}</Text><View style={ui.inputRow}>
    <TextInput accessibilityLabel={label} placeholderTextColor={colors.textMuted} autoCapitalize="none" autoCorrect={false} {...props}
      secureTextEntry={password && !visible} style={ui.input} />
    {password && <Pressable accessibilityRole="button" accessibilityLabel={(visible ? 'Hide ' : 'Show ') + label.toLowerCase()} onPress={() => setVisible(!visible)} style={ui.reveal}>
      <Text style={ui.link}>{visible ? 'Hide' : 'Show'}</Text></Pressable>}
  </View></View>;
}

export function Action({ title, onPress, busy, secondary, disabled }: { title: string; onPress: () => void; busy?: boolean; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || disabled, busy }} disabled={busy || disabled} onPress={onPress}
    style={({ pressed }) => [ui.button, secondary && ui.secondary, (pressed || busy || disabled) && { opacity: 0.6 }]}>
    {busy ? <ActivityIndicator color={colors.text} /> : <Text style={ui.buttonText}>{title}</Text>}
  </Pressable>;
}

export function Notice({ text, error = false }: { text: string | null; error?: boolean }) {
  return text ? <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[ui.notice, error && { color: '#FFB4A5' }]}>{text}</Text> : null;
}

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, padding: 28, paddingTop: 48, paddingBottom: 48, width: '100%', maxWidth: 520, alignSelf: 'center' },
  brandLine: { width: 34, height: 4, backgroundColor: colors.accent, marginBottom: 22 },
  eyebrow: { color: '#A3A3A3', fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 24 },
  title: { color: colors.text, fontSize: 38, fontWeight: '900', letterSpacing: -1, lineHeight: 43 },
  subtitle: { color: '#A3A3A3', fontSize: 15, lineHeight: 23, marginTop: 12 },
  form: { gap: 18, marginTop: 32 },
  field: { gap: 8 }, label: { color: '#D4D4D4', fontSize: 13, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: '#383838', borderRadius: 12 },
  input: { flex: 1, minWidth: 0, color: colors.text, padding: 16, fontSize: 16, minHeight: 54 },
  reveal: { padding: 14, minHeight: 48, justifyContent: 'center' }, link: { color: '#E5E5E5', fontSize: 13, fontWeight: '600' },
  button: { minHeight: 54, backgroundColor: colors.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 14 },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  notice: { color: '#BDBDBD', fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, gap: 14 },
  stat: { color: colors.text, fontSize: 25, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
