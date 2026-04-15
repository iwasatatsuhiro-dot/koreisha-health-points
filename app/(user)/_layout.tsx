import { Tabs } from 'expo-router';
import { colors } from '@/src/theme';
import { useAuthStore } from '@/src/stores/authStore';
import { usePushRegistration } from '@/src/hooks/usePushRegistration';

export default function UserLayout() {
  const kkpId = useAuthStore((s) => s.kkpId);
  usePushRegistration(kkpId);

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
      <Tabs.Screen name="events" options={{ title: 'イベント' }} />
      <Tabs.Screen name="vitals" options={{ title: 'バイタル' }} />
      <Tabs.Screen name="points" options={{ title: 'ポイント' }} />
      <Tabs.Screen name="notices" options={{ title: 'お知らせ' }} />
      <Tabs.Screen name="settings" options={{ title: '設定' }} />
      {/* 動的ルート（タブバーに出さない） */}
      <Tabs.Screen name="event/[id]" options={{ href: null, title: 'イベント詳細' }} />
      <Tabs.Screen name="videos" options={{ href: null, title: '健康動画' }} />
      <Tabs.Screen name="video/[id]" options={{ href: null, title: '動画視聴' }} />
      <Tabs.Screen name="missions" options={{ href: null, title: 'ミッション' }} />
      <Tabs.Screen name="inquiry" options={{ href: null, title: 'お問い合わせ' }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: '通知センター' }} />
    </Tabs>
  );
}
