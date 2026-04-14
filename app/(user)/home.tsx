import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { secretariatApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing } from '@/src/theme';

export default function Home() {
  const { kkpId, nickname, signOut } = useAuthStore();

  const balance = useQuery({
    queryKey: ['balance', kkpId],
    queryFn: () => secretariatApi.getBalance(kkpId!),
    enabled: !!kkpId,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">こんにちは{nickname ? `、${nickname}さん` : ''}</AppText>
        <AppText variant="caption">KKP-ID: {kkpId}</AppText>

        <View style={styles.card}>
          <AppText variant="heading">現有ポイント</AppText>
          {balance.isLoading && <AppText variant="body">読み込み中...</AppText>}
          {balance.data && (
            <>
              <AppText variant="title" style={{ color: colors.primary, marginTop: spacing.sm }}>
                {balance.data.current} pt
              </AppText>
              <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
                {balance.data.breakdown.map((b) => (
                  <AppText key={b.category} variant="body">
                    ・{b.category}: {b.earned} pt
                  </AppText>
                ))}
              </View>
            </>
          )}
        </View>

        <AppText variant="caption">
          ※ この画面は M1 (認証・ルーティング・モック基盤) のプレースホルダです。
          M2 以降で歩数・イベント・交換機能を順次実装します。
        </AppText>

        <AppButton label="ログアウト" variant="secondary" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  card: {
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
