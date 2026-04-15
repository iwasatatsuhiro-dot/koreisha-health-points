import { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import {
  secretariatApi,
  eventsApi,
  noticesApi,
  surveysApi,
  frailtyApi,
  missionsApi,
  healthChangesApi,
} from '@/src/services/api/endpoints';
import { isWinterMonth, WINTER_VIDEO_BONUS } from '@/src/utils/season';
import { useAuthStore } from '@/src/stores/authStore';
import {
  useDailySteps,
  useDevicePedometer,
  useSyncDeviceSteps,
  useWeeklySteps,
} from '@/src/hooks/useSteps';
import { useLatestVitalsByType } from '@/src/hooks/useVitals';
import { colors, radii, spacing } from '@/src/theme';
import type { FrailtyRiskLevel, VitalReading, VitalType } from '@/src/types';

const FRAILTY_LABELS: Record<FrailtyRiskLevel, { label: string; color: string }> = {
  low: { label: '良好', color: colors.success },
  medium: { label: '注意', color: colors.accent },
  high: { label: '要相談', color: colors.danger },
  unknown: { label: '判定中', color: colors.textMuted },
};

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

  const upcomingEvents = useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.listEvents,
    staleTime: 60_000,
    select: (evts) => evts.filter((e) => e.status === 'open').slice(0, 2),
  });

  const latestNotice = useQuery({
    queryKey: ['notices'],
    queryFn: noticesApi.listNotices,
    staleTime: 60_000,
    select: (notices) => notices[0] ?? null,
  });

  const pendingSurveys = useQuery({
    queryKey: ['surveys', kkpId],
    queryFn: () => surveysApi.listSurveys(kkpId!),
    enabled: !!kkpId,
    staleTime: 60_000,
    select: (surveys) => surveys.filter((s) => !s.answeredAt).length,
  });

  const frailty = useQuery({
    queryKey: ['frailty', kkpId],
    queryFn: () => frailtyApi.assess(kkpId!),
    enabled: !!kkpId,
    staleTime: 60_000,
  });

  const healthChanges = useQuery({
    queryKey: ['health-changes', kkpId],
    queryFn: () => healthChangesApi.list(kkpId!),
    enabled: !!kkpId,
    staleTime: 60_000,
  });

  const missions = useQuery({
    queryKey: ['missions', kkpId],
    queryFn: () => missionsApi.listMissions(kkpId!),
    enabled: !!kkpId,
    staleTime: 60_000,
    select: (list) => ({ total: list.length, completed: list.filter((m) => m.completed).length }),
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

  const pingActivity = useMutation({
    mutationFn: () => secretariatApi.pingActivity(kkpId!),
  });
  useEffect(() => {
    if (kkpId) pingActivity.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kkpId]);

  const winter = isWinterMonth();

  const todayCount =
    pedometer && pedometer.status === 'ok' ? pedometer.count : dailySteps.data?.count ?? 0;
  const goal = dailySteps.data?.goal ?? 6000;
  const progressPct = Math.min(100, Math.round((todayCount / goal) * 100));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">こんにちは{nickname ? `、${nickname}さん` : ''}</AppText>
        <AppText variant="caption">KKP-ID: {kkpId}</AppText>

        {winter && (
          <Card style={styles.winterCard}>
            <AppText variant="heading" style={styles.winterTitle}>❄ 冬季モード</AppText>
            <AppText variant="body">
              雪道で歩くのが難しい時期です。歩数目標を {goal.toLocaleString()} 歩に引き下げ、
              動画視聴ポイントを {WINTER_VIDEO_BONUS} 倍にしています。
            </AppText>
            <View style={styles.winterActions}>
              <AppButton
                label="健康動画を見る"
                variant="secondary"
                onPress={() => router.push('/(user)/videos')}
                style={styles.winterBtn}
              />
              <AppButton
                label="イベントに参加"
                variant="secondary"
                onPress={() => router.push('/(user)/events')}
                style={styles.winterBtn}
              />
            </View>
          </Card>
        )}

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

        {/* フレイルリスク */}
        <Card>
          <View style={styles.cardHeader}>
            <AppText variant="heading">健康リスク（フレイル）</AppText>
            {frailty.data && (
              <View style={[styles.riskBadge, { backgroundColor: FRAILTY_LABELS[frailty.data.level].color }]}>
                <AppText variant="caption" style={styles.riskBadgeText}>
                  {FRAILTY_LABELS[frailty.data.level].label}
                </AppText>
              </View>
            )}
          </View>
          {frailty.isLoading && <AppText variant="body">判定中...</AppText>}
          {frailty.data && (
            <>
              {frailty.data.factors.map((f) => (
                <View key={f.label} style={styles.factorRow}>
                  <AppText variant="body" style={{ flex: 1 }}>{f.label}</AppText>
                  <AppText variant="body" style={styles.muted}>{f.detail}</AppText>
                </View>
              ))}
              <AppText variant="body" style={styles.adviceText}>{frailty.data.advice}</AppText>
            </>
          )}
        </Card>

        {/* 健康状態の変化 */}
        {healthChanges.data && healthChanges.data.changes.length > 0 && (
          <Card style={styles.changeCard}>
            <View style={styles.cardHeader}>
              <AppText variant="heading">健康状態の変化</AppText>
              <AppButton
                label="すべて見る"
                variant="secondary"
                onPress={() => router.push('/(user)/health-changes')}
                style={styles.smallBtn}
              />
            </View>
            {healthChanges.data.changes.slice(0, 2).map((c) => {
              const color =
                c.direction === 'improved'
                  ? colors.success
                  : c.direction === 'worsened'
                    ? colors.danger
                    : colors.accent;
              return (
                <View key={c.id} style={[styles.changeRow, { borderLeftColor: color }]}>
                  <AppText variant="body" style={{ fontWeight: '700' }}>{c.title}</AppText>
                  <AppText variant="caption" style={styles.muted}>{c.body}</AppText>
                </View>
              );
            })}
          </Card>
        )}

        <Card>
          <AppText variant="heading">現有ポイント</AppText>
          {balance.isLoading && <AppText variant="body">読み込み中...</AppText>}
          {balance.data && (
            <AppText variant="title" style={{ color: colors.primary }}>
              {balance.data.current} pt
            </AppText>
          )}
          <AppButton label="ポイント詳細・交換" variant="secondary" onPress={() => router.push('/(user)/points')} />
        </Card>

        {/* ミッション */}
        <Card>
          <View style={styles.cardHeader}>
            <AppText variant="heading">
              ミッション{missions.data ? `（${missions.data.completed}/${missions.data.total}達成）` : ''}
            </AppText>
            <AppButton label="一覧を見る" variant="secondary" onPress={() => router.push('/(user)/missions')} style={styles.smallBtn} />
          </View>
          <AppText variant="body" style={styles.muted}>
            目標達成でポイント獲得・ランキングも確認できます
          </AppText>
        </Card>

        {/* 健康動画 */}
        <Card>
          <View style={styles.cardHeader}>
            <AppText variant="heading">健康動画</AppText>
            <AppButton label="一覧を見る" variant="secondary" onPress={() => router.push('/(user)/videos')} style={styles.smallBtn} />
          </View>
          <AppText variant="body" style={styles.muted}>
            フレイル予防・運動・食事など。1日1回ポイントを獲得できます。
          </AppText>
        </Card>

        {/* 開催予定イベント */}
        <Card>
          <View style={styles.cardHeader}>
            <AppText variant="heading">開催予定イベント</AppText>
            <AppButton label="すべて見る" variant="secondary" onPress={() => router.push('/(user)/events')} style={styles.smallBtn} />
          </View>
          {upcomingEvents.data?.length === 0 && (
            <AppText variant="body" style={styles.muted}>現在開催予定のイベントはありません</AppText>
          )}
          {upcomingEvents.data?.map((evt) => (
            <View key={evt.id} style={styles.eventRow}>
              <AppText variant="body" style={styles.eventTitle}>{evt.title}</AppText>
              <AppText variant="caption" style={styles.eventPts}>+{evt.pointsAwarded}pt</AppText>
            </View>
          ))}
        </Card>

        {/* お知らせ */}
        <Card>
          <View style={styles.cardHeader}>
            <AppText variant="heading">
              お知らせ{(pendingSurveys.data ?? 0) > 0 ? `（アンケート ${pendingSurveys.data}件）` : ''}
            </AppText>
            <AppButton label="すべて見る" variant="secondary" onPress={() => router.push('/(user)/notices')} style={styles.smallBtn} />
          </View>
          {latestNotice.data ? (
            <AppText variant="body" numberOfLines={2}>{latestNotice.data.title}</AppText>
          ) : (
            <AppText variant="body" style={styles.muted}>お知らせはありません</AppText>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallBtn: { paddingHorizontal: spacing.sm, minHeight: 36 },
  eventRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  eventTitle: { flex: 1 },
  eventPts: { color: colors.success, fontWeight: '700' },
  muted: { color: colors.textMuted },
  riskBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.pill },
  riskBadgeText: { color: '#FFFFFF', fontWeight: '700' },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  adviceText: { marginTop: spacing.sm },
  changeCard: { gap: spacing.sm },
  changeRow: {
    borderLeftWidth: 4,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  winterCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#EAF2FA',
    gap: spacing.sm,
  },
  winterTitle: { color: colors.primary },
  winterActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  winterBtn: { flex: 1 },
});
