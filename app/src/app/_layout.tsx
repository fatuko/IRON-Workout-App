import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const colors = { background: '#101319', card: '#191e27', text: '#f5f7fa', accent: '#e6b75c' };

export default function RootLayout() {
  return <>
    <StatusBar style="light" />
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      tabBarStyle: { backgroundColor: colors.card, borderTopColor: '#303745' },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: '#9aa5b5',
      sceneStyle: { backgroundColor: colors.background },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="splits" options={{ title: 'Splits' }} />
      <Tabs.Screen name="workout" options={{ title: 'Workout' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="progression" options={{ title: 'Progress' }} />
    </Tabs>
  </>;
}
