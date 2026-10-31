import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/auth/provider';
import { colors } from '@/constants/theme';

function Routes() {
  const { session, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="Restoring account" color={colors.accent} />
  </View>;
  const onboarded = session?.user.user_metadata.onboarding_complete === true;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
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
  </Stack>;
}

export default function RootLayout() {
  return <AuthProvider><StatusBar style="light" /><Routes /></AuthProvider>;
}
