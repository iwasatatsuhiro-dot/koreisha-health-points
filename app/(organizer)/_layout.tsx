import { Tabs } from 'expo-router';
import { colors } from '@/src/theme';

export default function OrganizerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
        tabBarStyle: { minHeight: 64 },
        headerStyle: { backgroundColor: colors.accent },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'ホーム' }} />
      <Tabs.Screen name="events" options={{ title: 'イベント管理' }} />
      <Tabs.Screen name="settings" options={{ title: '設定' }} />
      <Tabs.Screen name="terms" options={{ href: null, title: '利用規約' }} />
      <Tabs.Screen name="withdraw" options={{ href: null, title: '退会' }} />
    </Tabs>
  );
}
