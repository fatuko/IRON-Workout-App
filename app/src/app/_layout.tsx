import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '@/auth/provider';
import { colors } from '@/constants/theme';
import { PreviewBanner } from '@/components/preview-banner';
import { startPreview } from '@/auth/preview';

function Routes() {
  const { session, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="Restoring account" color={colors.accent} />
    {__DEV__ && <Pressable accessibilityRole="button" onPress={startPreview} style={{ padding: 24 }}><Text style={{ color: colors.text, textAlign: 'center' }}>Preview screens without an account</Text></Pressable>}
  </View>;
  const onboarded = session?.user.user_metadata.onboarding_complete === true;
  return <View style={{ flex: 1 }}><PreviewBanner /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Protected guard={!session}>
      <Stack.Screen name="sign-in" /><Stack.Screen name="sign-up" /><Stack.Screen name="verify-email" />
    </Stack.Protected>
    <Stack.Protected guard={!!session}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Protected guard={onboarded}><Stack.Screen name="profile" /><Stack.Screen name="account-settings" /></Stack.Protected>
      <Stack.Screen name="reset-password" />
    </Stack.Protected>
    <Stack.Screen name="forgot-password" /><Stack.Screen name="auth-callback" />
  </Stack></View>;
}

export default function RootLayout() {
  return <AuthProvider><StatusBar style="light" /><Routes /></AuthProvider>;
}
