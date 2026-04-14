import { Tabs } from 'expo-router';
import { colors } from '@/src/theme';

export default function OrganizerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarLabelStyle: { fontSize: 14, fontWeight: '700' },
        tabBarStyle: { minHeight: 64 },
        headerStyle: { backgroundColor: colors.accent },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tabs.Screen name="home" options={{ title: '開催者ホーム' }} />
    </Tabs>
  );
}
