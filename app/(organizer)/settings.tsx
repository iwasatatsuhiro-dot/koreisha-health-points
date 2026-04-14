import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';

export default function OrganizerSettings() {
  const router = useRouter();
  const { kkpId, signOut } = useAuthStore();

  function handleSignOut() {
    signOut();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">設定</AppText>

        <Card style={styles.idCard}>
          <AppText variant="heading">開催者ID</AppText>
          <AppText variant="body" style={styles.kkpId}>{kkpId}</AppText>
          {kkpId && (
            <View style={styles.qrWrapper}>
              <QRCode value={kkpId} size={160} />
            </View>
          )}
          <AppText variant="caption" style={styles.hint}>
            このQRコードはあなたの開催者IDです
          </AppText>
        </Card>

        <View style={{ marginTop: spacing.md }}>
          <AppButton label="ログアウト" variant="secondary" onPress={handleSignOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  idCard: { alignItems: 'center', gap: spacing.md },
  kkpId: { fontWeight: '700', color: colors.accent },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { color: colors.textMuted, textAlign: 'center' },
});
