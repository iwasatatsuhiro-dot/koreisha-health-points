import { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { secretariatApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import {
  useDailySteps,
  useDevicePedometer,
  useSyncDeviceSteps,
  useWeeklySteps,
} from '@/src/hooks/useSteps';
import { useLatestVitalsByType } from '@/src/hooks/useVitals';
import { colors, radii, spacing } from '@/src/theme';
import type { VitalReading, VitalType } from '@/src/types';

const VITAL_LABELS: Record<VitalType, string> = {
  blood_pressure: '血圧',
  heart_rate: '心拍',
  temperature: '体温',
  weight: '体重',
};

function formatVital(v: VitalReading | undefined): string {
  if (!v) return '未記録';
  switch (v.type) {
    case 'blood_pressure':
      return `${v.systolic ?? '-'} / ${v.diastolic ?? '-'} mmHg`;
    case 'heart_rate':
      return `${v.bpm ?? '-'} bpm`;
    case 'temperature':
      return `${v.celsius?.toFixed(1) ?? '-'} ℃`;
    case 'weight':
      return `${v.weightKg?.toFixed(1) ?? '-'} kg`;
  }
}

export default function Home() {
  const router = useRouter();
  const { kkpId, nickname } = useAuthStore();

  const balance = useQuery({
    queryKey: ['balance', kkpId],
    queryFn: () => secretariatApi.getBalance(kkpId!),
    enabled: !!kkpId,
  });

  const dailySteps = useDailySteps(kkpId);
  const weeklySteps = useWeeklySteps(kkpId);
  const pedometer = useDevicePedometer();
  const syncSteps = useSyncDeviceSteps(kkpId);
  const { latest } = useLatestVitalsByType(kkpId);

  useEffect(() => {
    if (pedometer && pedometer.status === 'ok' && kkpId) {
      if (pedometer.count !== dailySteps.data?.count) {
        syncSteps.mutate(pedometer.count);
      }
    }
  }, [pedometer, kkpId, dailySteps.data?.count, syncSteps]);

  const todayCount =
    pedometer && pedometer.status === 'ok' ? pedometer.count : dailySteps.data?.count ?? 0;
  const goal = dailySteps.data?.goal ?? 6000;
  const progressPct = Math.min(100, Math.round((todayCount / goal) * 100));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">こんにちは{nickname ? `、${nickname}さん` : ''}</AppText>
        <AppText variant="caption">KKP-ID: {kkpId}</AppText>

        <Card>
          <AppText variant="heading">本日の歩数</AppText>
          <AppText variant="title" style={{ color: colors.primary }}>
            {todayCount.toLocaleString()} 歩
          </AppText>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <AppText variant="body">
            目標 {goal.toLocaleString()} 歩 / 達成 {progressPct}%
          </AppText>
          {pedometer?.status === 'unsupported' && (
            <AppText variant="caption">※ この端末は歩数センサー非対応のためサンプル値を表示しています。</AppText>
          )}
          {pedometer?.status === 'denied' && (
            <AppText variant="caption">※ モーション権限が許可されていません。設定から許可してください。</AppText>
          )}
        </Card>

        <Card>
          <AppText variant="heading">今週の歩数</AppText>
          {weeklySteps.isLoading && <AppText variant="body">読み込み中...</AppText>}
          {weeklySteps.data && (
            <>
              <AppText variant="body">
                合計 {weeklySteps.data.total.toLocaleString()} 歩
              </AppText>
              <View style={styles.barRow}>
                {weeklySteps.data.days.map((d) => {
                  const h = Math.max(4, Math.min(72, (d.count / goal) * 72));
                  return (
                    <View key={d.date} style={styles.barCol}>
                      <View style={[styles.bar, { height: h }]} />
                      <AppText variant="caption">{d.date.slice(5)}</AppText>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </Card>

        <Card>
          <AppText variant="heading">バイタル</AppText>
          {(Object.keys(VITAL_LABELS) as VitalType[]).map((t) => (
            <View key={t} style={styles.vitalRow}>
              <AppText variant="body" style={{ flex: 1 }}>
                {VITAL_LABELS[t]}
              </AppText>
              <AppText variant="body">{formatVital(latest[t])}</AppText>
            </View>
          ))}
          <AppButton label="バイタルを記録する" onPress={() => router.push('/(user)/vitals')} />
        </Card>

        <Card>
          <AppText variant="heading">現有ポイント</AppText>
          {balance.isLoading && <AppText variant="body">読み込み中...</AppText>}
          {balance.data && (
            <>
              <AppText variant="title" style={{ color: colors.primary }}>
                {balance.data.current} pt
              </AppText>
              <View style={{ gap: spacing.xs }}>
                {balance.data.breakdown.map((b) => (
                  <AppText key={b.category} variant="body">
                    ・{b.category}: {b.earned} pt
                  </AppText>
                ))}
              </View>
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  progressTrack: {
    height: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 96,
    marginTop: spacing.sm,
  },
  barCol: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  bar: {
    width: 20,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
