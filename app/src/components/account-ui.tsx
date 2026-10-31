import { useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Image, type ImageSource } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { colors } from '@/constants/theme';

// Set this source when the chosen background photo is available.
const AUTH_BACKGROUND: ImageSource | undefined = undefined;

export function AccountPage({ eyebrow, title, subtitle = '', children, glass = false, compact = false, centered = false, onBack, backDisabled = false }: { eyebrow?: string; title: string; subtitle?: string; children: ReactNode; glass?: boolean; compact?: boolean; centered?: boolean; onBack?: () => void; backDisabled?: boolean }) {
  const content = <>
    {!glass && <View style={ui.brandLine} />}
    {eyebrow ? <Text style={[ui.eyebrow, centered && ui.centeredGreeting]}>{eyebrow}</Text> : null}
    <Text style={[ui.title, compact && ui.compactTitle, centered && ui.centeredText]}>{title}</Text>{subtitle ? <Text style={[ui.subtitle, centered && ui.centeredText]}>{subtitle}</Text> : null}
    <View style={[ui.form, compact && ui.compactForm]}>{children}</View>
  </>;
  return <View style={ui.screen}>
    {glass && <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {AUTH_BACKGROUND ? <Image source={AUTH_BACKGROUND} contentFit="cover" style={StyleSheet.absoluteFill} /> : <>
        <View style={ui.ambientOrange} /><View style={ui.ambientLight} />
      </>}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
    </View>}
    <SafeAreaView style={ui.transparentScreen}>
      {onBack && <View style={ui.backRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={backDisabled} onPress={onBack} style={[ui.backButton, backDisabled && { opacity: 0.5 }]}>
          <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor="#000000" />
        </Pressable>
      </View>}
      <KeyboardAvoidingView style={ui.transparentScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[ui.page, glass && ui.glassPage]}>
        {glass ? <View style={ui.glassCard}>
          <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[ui.glassContent, compact && ui.compactContent]}>{content}</View>
        </View> : content}
      </ScrollView>
    </KeyboardAvoidingView></SafeAreaView>
  </View>;
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
  transparentScreen: { flex: 1 },
  centeredText: { textAlign: 'center' },
  centeredGreeting: { textAlign: 'center', fontSize: 20, letterSpacing: 0, color: colors.text, marginBottom: 16 },
  backRow: { alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 12 },
  backButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  glassPage: { paddingHorizontal: 20, justifyContent: 'center' },
  glassCard: { borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(32,32,32,0.35)' },
  glassContent: { padding: 24 },
  compactContent: { padding: 20 },
  compactTitle: { fontSize: 32, lineHeight: 38 },
  compactForm: { gap: 12, marginTop: 20 },
  ambientOrange: { position: 'absolute', width: 360, height: 520, borderRadius: 180, backgroundColor: '#4A2013', right: -220, top: '10%', transform: [{ rotate: '-25deg' }] },
  ambientLight: { position: 'absolute', width: 280, height: 580, borderRadius: 140, backgroundColor: '#303030', left: -200, bottom: -100, transform: [{ rotate: '25deg' }] },
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
