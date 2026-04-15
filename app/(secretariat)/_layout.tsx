import { Tabs } from 'expo-router';
import { colors } from '@/src/theme';

export default function SecretariatLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
        tabBarStyle: { minHeight: 64 },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'ホーム' }} />
      <Tabs.Screen name="events" options={{ title: 'イベント承認' }} />
      <Tabs.Screen name="notices" options={{ title: 'お知らせ管理' }} />
      <Tabs.Screen name="settings" options={{ title: '設定' }} />
    </Tabs>
  );
}
