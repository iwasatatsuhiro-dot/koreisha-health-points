import { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { secretariatApi, paymentGwApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';
import type { ExchangeProvider, PointHistoryCategory } from '@/src/types';

const CATEGORY_LABEL: Record<PointHistoryCategory, string> = {
  walk: '歩数',
  event: 'イベント',
  video: '動画視聴',
  survey: 'アンケート',
  manual: '手動付与',
  exchange: 'ポイント交換',
};

const CATEGORY_COLOR: Record<PointHistoryCategory, string> = {
  walk: '#1E8449',
  event: '#2471A3',
  video: '#7D3C98',
  survey: '#D35400',
  manual: '#717D7E',
  exchange: '#C0392B',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function PointsScreen() {
  const kkpId = useAuthStore((s) => s.kkpId)!;
  const qc = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<ExchangeProvider | null>(null);
  const [exchangePoints, setExchangePoints] = useState(100);

  const { data: balance } = useQuery({
    queryKey: ['balance', kkpId],
    queryFn: () => secretariatApi.getBalance(kkpId),
    staleTime: 30_000,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['history', kkpId],
    queryFn: () => secretariatApi.getHistory(kkpId),
    staleTime: 30_000,
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: paymentGwApi.listProviders,
    staleTime: 300_000,
  });

  const exchangeMutation = useMutation({
    mutationFn: ({ providerId, points }: { providerId: string; points: number }) =>
      paymentGwApi.exchangePoints(kkpId, providerId, points),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['history'] });
      setSelectedProvider(null);
      Alert.alert('交換完了', `${data.provider}へ${data.exchangedPoints}pt分を交換しました。`);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.error;
      if (code === 'insufficient_points') {
        Alert.alert('ポイント不足', 'ポイントが不足しています。');
      } else if (code === 'below_minimum') {
        Alert.alert('最低交換ポイント未満', `${err?.response?.data?.minPoints}pt以上から交換できます。`);
      } else {
        Alert.alert('エラー', '交換処理に失敗しました。');
      }
    },
  });

  function handleExchange() {
    if (!selectedProvider) return;
    if (exchangePoints < selectedProvider.minPoints) {
      Alert.alert('最低交換ポイント未満', `${selectedProvider.minPoints}pt以上から交換できます。`);
      return;
    }
    if (!balance || exchangePoints > balance.current) {
      Alert.alert('ポイント不足', '保有ポイントが不足しています。');
      return;
    }
    Alert.alert(
      'ポイント交換確認',
      `${selectedProvider.name}へ${exchangePoints}ptを交換します。よろしいですか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '交換する',
          onPress: () => exchangeMutation.mutate({ providerId: selectedProvider.id, points: exchangePoints }),
        },
      ],
    );
  }

  const POINT_STEPS = [50, 100, 200, 500];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">ポイント</AppText>

        {/* 現有ポイント */}
        <Card style={styles.balanceCard}>
          <AppText variant="caption" style={styles.balanceLabel}>現有ポイント</AppText>
          <AppText variant="title" style={styles.balanceValue}>
            {balance?.current ?? 0}
            <AppText variant="body"> pt</AppText>
          </AppText>
          {balance?.breakdown && balance.breakdown.length > 0 && (
            <View style={styles.breakdown}>
              {balance.breakdown.filter((b) => b.earned > 0).map((b) => (
                <View key={b.category} style={styles.breakdownRow}>
                  <View style={[styles.dot, { backgroundColor: CATEGORY_COLOR[b.category as PointHistoryCategory] }]} />
                  <AppText variant="caption" style={styles.breakdownLabel}>
                    {CATEGORY_LABEL[b.category as PointHistoryCategory]}
                  </AppText>
                  <AppText variant="caption" style={styles.breakdownValue}>{b.earned}pt</AppText>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* ポイント交換 */}
        <Card>
          <AppText variant="heading">ポイント交換</AppText>
          <AppText variant="caption" style={styles.hint}>
            貯まったポイントを電子マネーやポイントに交換できます
          </AppText>

          <AppText variant="body" style={styles.sectionLabel}>交換先を選択</AppText>
          <View style={styles.providerGrid}>
            {providers.map((p) => (
              <AppButton
                key={p.id}
                label={`${p.name}\n（${p.minPoints}pt〜）`}
                variant={selectedProvider?.id === p.id ? 'primary' : 'secondary'}
                onPress={() => setSelectedProvider(p)}
                style={styles.providerBtn}
              />
            ))}
          </View>

          {selectedProvider && (
            <>
              <AppText variant="body" style={styles.sectionLabel}>交換ポイント数</AppText>
              <View style={styles.pointSteps}>
                {POINT_STEPS.map((pt) => (
                  <AppButton
                    key={pt}
                    label={`${pt}pt`}
                    variant={exchangePoints === pt ? 'primary' : 'secondary'}
                    onPress={() => setExchangePoints(pt)}
                    style={styles.stepBtn}
                  />
                ))}
              </View>
              <AppButton
                label={exchangeMutation.isPending ? '処理中...' : `${selectedProvider.name}へ${exchangePoints}pt交換`}
                onPress={handleExchange}
                disabled={exchangeMutation.isPending}
              />
            </>
          )}
        </Card>

        {/* ポイント履歴 */}
        <Card>
          <AppText variant="heading">獲得・交換履歴</AppText>
          {history.length === 0 ? (
            <AppText variant="body" style={styles.emptyText}>履歴がありません</AppText>
          ) : (
            <View style={styles.historyList}>
              {history.map((h) => (
                <View key={h.id} style={styles.historyRow}>
                  <View style={[styles.histCategoryDot, { backgroundColor: CATEGORY_COLOR[h.category] }]} />
                  <View style={styles.histInfo}>
                    <AppText variant="caption" style={styles.histCategory}>
                      {CATEGORY_LABEL[h.category]}
                    </AppText>
                    <AppText variant="body" style={styles.histNote} numberOfLines={1}>
                      {h.note}
                    </AppText>
                  </View>
                  <View style={styles.histRight}>
                    <AppText
                      variant="body"
                      style={[styles.histDelta, { color: h.delta >= 0 ? colors.success : colors.danger }]}
                    >
                      {h.delta >= 0 ? '+' : ''}{h.delta}pt
                    </AppText>
                    <AppText variant="caption" style={styles.histDate}>{formatDate(h.recordedAt)}</AppText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  balanceCard: { alignItems: 'center', gap: spacing.sm },
  balanceLabel: { color: colors.textMuted },
  balanceValue: { color: colors.primary, fontSize: 48 },
  breakdown: { width: '100%', gap: spacing.xs, marginTop: spacing.sm },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { flex: 1, color: colors.textMuted },
  breakdownValue: { fontWeight: '700' },
  hint: { color: colors.textMuted, marginBottom: spacing.sm },
  sectionLabel: { fontWeight: '700', marginTop: spacing.sm },
  providerGrid: { gap: spacing.sm },
  providerBtn: { minHeight: 56 },
  pointSteps: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  stepBtn: { flex: 1, minWidth: 70 },
  historyList: { gap: spacing.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  histCategoryDot: { width: 12, height: 12, borderRadius: 6 },
  histInfo: { flex: 1 },
  histCategory: { color: colors.textMuted },
  histNote: {},
  histRight: { alignItems: 'flex-end' },
  histDelta: { fontWeight: '700' },
  histDate: { color: colors.textMuted },
  emptyText: { color: colors.textMuted },
});
