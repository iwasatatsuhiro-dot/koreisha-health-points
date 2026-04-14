import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';

export default function OrganizerHome() {
  const { kkpId, signOut } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">イベント開催者ホーム</AppText>
        <AppText variant="caption">開催者ID: {kkpId}</AppText>

        <AppText variant="body" style={{ marginTop: spacing.md }}>
          このモードでは、イベント情報の登録・QRコード発行・参加者QR読取によるポイント付与を行います。
          M5 で機能を実装予定です。
        </AppText>

        <AppButton label="ログアウト" variant="secondary" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
});
