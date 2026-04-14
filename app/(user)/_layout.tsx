import { Tabs } from 'expo-router';
import { colors } from '@/src/theme';

export default function UserLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarLabelStyle: { fontSize: 14, fontWeight: '700' },
        tabBarStyle: { minHeight: 64 },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'ホーム' }} />
      <Tabs.Screen name="vitals" options={{ title: 'バイタル' }} />
      <Tabs.Screen name="settings" options={{ title: '設定' }} />
    </Tabs>
  );
}
