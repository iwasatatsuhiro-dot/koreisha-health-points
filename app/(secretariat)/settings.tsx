import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';

export default function SecretariatSettings() {
  const router = useRouter();
  const { kkpId, deviceId, signOut } = useAuthStore();

  function handleSignOut() {
    signOut();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">設定</AppText>

        <Card>
          <AppText variant="heading">事務局ID</AppText>
          <AppText variant="body" style={styles.kkpId}>{kkpId}</AppText>
          <AppText variant="caption" style={styles.hint}>
            事務局アカウントでは、イベント承認とお知らせ配信を管理できます。
          </AppText>
        </Card>

        <Card>
          <AppText variant="heading">ご利用の端末</AppText>
          {deviceId && (
            <AppText variant="caption" style={styles.hint}>
              端末ID: {deviceId.slice(0, 16)}…
            </AppText>
          )}
        </Card>

        <AppButton label="ログアウト" variant="secondary" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  kkpId: { fontWeight: '700', color: colors.primary },
  hint: { color: colors.textMuted },
});
