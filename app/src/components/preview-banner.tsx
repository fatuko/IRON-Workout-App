import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/provider';
import { exitPreview } from '@/auth/preview';
import { colors } from '@/constants/theme';

export function PreviewBanner() {
  const { preview, session } = useAuth();
  const router = useRouter();
  if (!__DEV__ || !preview) return null;
  return <SafeAreaView edges={['top']} style={{ backgroundColor: colors.accentDark }}><View style={{ padding: 12, gap: 8 }}>
    <Text style={{ color: colors.text, fontSize: 12 }}>PREVIEW · Sample account · No emails sent</Text>
    <View style={{ flexDirection: 'row', gap: 20 }}>
      {session && <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding')} style={{ paddingVertical: 8 }}><Text style={{ color: colors.text }}>Onboarding</Text></Pressable>}
      {session?.user.user_metadata.onboarding_complete === true && <Pressable accessibilityRole="button" onPress={() => router.push('/profile')} style={{ paddingVertical: 8 }}><Text style={{ color: colors.text }}>Profile</Text></Pressable>}
      <Pressable accessibilityRole="button" onPress={exitPreview} style={{ paddingVertical: 8 }}><Text style={{ color: colors.text }}>Exit preview</Text></Pressable>
    </View>
  </View></SafeAreaView>;
}
