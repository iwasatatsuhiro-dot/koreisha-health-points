import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { secretariatApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';
import type { PointHistory } from '@/src/types';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ExchangeHistoryScreen() {
  const router = useRouter();
  const kkpId = useAuthStore((s) => s.kkpId)!;

  const { data: history = [], isLoading } = useQuery<PointHistory[]>({
    queryKey: ['history', kkpId],
    queryFn: () => secretariatApi.getHistory(kkpId),
    staleTime: 30_000,
  });

  const exchanges = useMemo(
    () => history.filter((h) => h.category === 'exchange'),
    [history],
  );
  const totalExchanged = exchanges.reduce((s, h) => s + Math.abs(h.delta), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">交換履歴</AppText>

        <Card style={styles.summary}>
          <AppText variant="caption" style={styles.muted}>累計交換ポイント</AppText>
          <AppText variant="title" style={styles.summaryValue}>
            {totalExchanged}
            <AppText variant="body"> pt</AppText>
          </AppText>
          <AppText variant="caption" style={styles.muted}>
            全{exchanges.length}件の交換
          </AppText>
        </Card>

        {isLoading ? (
          <AppText variant="body">読み込み中...</AppText>
        ) : exchanges.length === 0 ? (
          <Card>
            <AppText variant="body" style={styles.muted}>
              まだ交換履歴がありません。
            </AppText>
          </Card>
        ) : (
          exchanges.map((h) => (
            <Card key={h.id} style={styles.row}>
              <View style={styles.rowTop}>
                <AppText variant="heading" style={styles.provider}>
                  {h.note}
                </AppText>
                <AppText variant="heading" style={styles.delta}>
                  −{Math.abs(h.delta)}pt
                </AppText>
              </View>
              <AppText variant="caption" style={styles.muted}>
                {formatDateTime(h.recordedAt)}
              </AppText>
            </Card>
          ))
        )}

        <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  summary: { alignItems: 'center', gap: spacing.xs },
  summaryValue: { color: colors.primary, fontSize: 40 },
  muted: { color: colors.textMuted },
  row: { gap: spacing.xs },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  provider: { flex: 1 },
  delta: { color: colors.danger, fontWeight: '700' },
});
