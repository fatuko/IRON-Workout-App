import { useCallback, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { LaunchScreen } from '@/components/launch-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '@/auth/provider';
import { colors } from '@/constants/theme';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function Routes() {
  const { session, loading } = useAuth();
  const [introComplete, setIntroComplete] = useState(false);
  const finishIntro = useCallback(() => setIntroComplete(true), []);
  if (!introComplete || loading) return <LaunchScreen ready={!loading} onComplete={finishIntro} />;
  return <View style={{ flex: 1 }}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Protected guard={!session}>
      <Stack.Screen name="sign-in" /><Stack.Screen name="sign-up" /><Stack.Screen name="verify-email" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="account-settings" />
      <Stack.Screen name="reset-password" />
    </Stack.Protected>
    <Stack.Screen name="forgot-password" /><Stack.Screen name="auth-callback" />
  </Stack></View>;
}

export default function RootLayout() {
  return <AuthProvider><StatusBar style="light" /><Routes /></AuthProvider>;
}
