import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { Card } from '@/src/components/ui/Card';
import { AppButton } from '@/src/components/ui/AppButton';
import { useRouter } from 'expo-router';
import { secretariatApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';
import { EARNING_CATEGORIES, POINT_CATEGORY_COLOR, POINT_CATEGORY_LABEL } from '@/src/constants/points';
import type { PointHistory, PointHistoryCategory } from '@/src/types';

type Period = 'all' | 'month' | 'prevMonth';

const PERIOD_LABEL: Record<Period, string> = {
  all: '全期間',
  month: '今月',
  prevMonth: '先月',
};

function matchesPeriod(iso: string, period: Period): boolean {
  if (period === 'all') return true;
  const d = new Date(iso);
  const now = new Date();
  if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
}

export default function PointBreakdownScreen() {
  const router = useRouter();
  const kkpId = useAuthStore((s) => s.kkpId)!;
  const [period, setPeriod] = useState<Period>('all');

  const { data: history = [], isLoading } = useQuery<PointHistory[]>({
    queryKey: ['history', kkpId],
    queryFn: () => secretariatApi.getHistory(kkpId),
    staleTime: 30_000,
  });

  const { earnedByCategory, totalEarned } = useMemo(() => {
    const earnings: Record<PointHistoryCategory, number> = {
      walk: 0, event: 0, video: 0, survey: 0, manual: 0, exchange: 0,
    };
    for (const h of history) {
      if (h.delta <= 0) continue;
      if (!matchesPeriod(h.recordedAt, period)) continue;
      earnings[h.category] += h.delta;
    }
    const total = EARNING_CATEGORIES.reduce((s, c) => s + earnings[c], 0);
    return { earnedByCategory: earnings, totalEarned: total };
  }, [history, period]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">ポイント内訳</AppText>

        <View style={styles.periodRow}>
          {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
              accessibilityRole="button"
              accessibilityState={{ selected: period === p }}
            >
              <AppText variant="body" style={[styles.periodText, period === p && styles.periodTextActive]}>
                {PERIOD_LABEL[p]}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <Card>
          <AppText variant="caption" style={styles.muted}>獲得ポイント合計</AppText>
          <AppText variant="title" style={styles.totalValue}>
            {totalEarned}
            <AppText variant="body"> pt</AppText>
          </AppText>

          {isLoading ? (
            <AppText variant="body">読み込み中...</AppText>
          ) : totalEarned === 0 ? (
            <AppText variant="body" style={styles.muted}>この期間の獲得はありません</AppText>
          ) : (
            <View style={styles.chartWrap}>
              <View style={styles.bar}>
                {EARNING_CATEGORIES.map((c) => {
                  const v = earnedByCategory[c];
                  if (v === 0) return null;
                  const flex = v / totalEarned;
                  return <View key={c} style={{ flex, backgroundColor: POINT_CATEGORY_COLOR[c] }} />;
                })}
              </View>

              <View style={styles.legend}>
                {EARNING_CATEGORIES.map((c) => {
                  const v = earnedByCategory[c];
                  const pct = totalEarned === 0 ? 0 : Math.round((v / totalEarned) * 100);
                  return (
                    <View key={c} style={styles.legendRow}>
                      <View style={[styles.dot, { backgroundColor: POINT_CATEGORY_COLOR[c] }]} />
                      <AppText variant="body" style={styles.legendLabel}>
                        {POINT_CATEGORY_LABEL[c]}
                      </AppText>
                      <AppText variant="body" style={styles.legendValue}>
                        {v}pt（{pct}%）
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </Card>

        <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: colors.primary },
  periodText: { color: colors.textMuted, fontWeight: '700' },
  periodTextActive: { color: '#fff' },
  totalValue: { color: colors.primary, fontSize: 40 },
  muted: { color: colors.textMuted },
  chartWrap: { gap: spacing.md, marginTop: spacing.sm },
  bar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  legend: { gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1 },
  legendValue: { fontWeight: '700' },
});
