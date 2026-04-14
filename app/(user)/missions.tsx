import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { Card } from '@/src/components/ui/Card';
import { missionsApi, rankingApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing } from '@/src/theme';
import type { Mission, MissionPeriod, RankingEntry } from '@/src/types';

const PERIOD_LABELS: Record<MissionPeriod, string> = {
  daily: '今日',
  weekly: '今週',
  monthly: '今月',
};

export default function Missions() {
  const { kkpId } = useAuthStore();

  const missions = useQuery({
    queryKey: ['missions', kkpId],
    queryFn: () => missionsApi.listMissions(kkpId!),
    enabled: !!kkpId,
  });

  const ranking = useQuery({
    queryKey: ['ranking', kkpId],
    queryFn: () => rankingApi.getRanking(kkpId!),
    enabled: !!kkpId,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">ミッション</AppText>
        <AppText variant="body" style={styles.muted}>
          日々の目標にチャレンジしてポイントを獲得しましょう。
        </AppText>

        {missions.isLoading && <AppText variant="body">読み込み中...</AppText>}
        {missions.data?.map((m) => <MissionCard key={m.id} mission={m} />)}

        <View style={{ height: spacing.md }} />

        <AppText variant="title">ランキング（直近30日）</AppText>
        <AppText variant="body" style={styles.muted}>
          獲得ポイントが多い順に上位10名を表示します。
        </AppText>

        {ranking.isLoading && <AppText variant="body">読み込み中...</AppText>}
        {ranking.data && (
          <Card>
            {ranking.data.map((r) => <RankingRow key={`${r.rank}-${r.kkpId}`} entry={r} />)}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MissionCard({ mission }: { mission: Mission }) {
  const pct = mission.target > 0 ? Math.min(100, Math.round((mission.progress / mission.target) * 100)) : 0;
  return (
    <Card>
      <View style={styles.missionHead}>
        <View style={styles.periodPill}>
          <AppText variant="caption" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {PERIOD_LABELS[mission.period]}
          </AppText>
        </View>
        <AppText variant="caption" style={{ color: colors.success, fontWeight: '700' }}>
          +{mission.pointsAwarded}pt
        </AppText>
      </View>
      <AppText variant="heading">{mission.title}</AppText>
      <AppText variant="body" style={styles.muted}>{mission.description}</AppText>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%`, backgroundColor: mission.completed ? colors.success : colors.primary },
          ]}
        />
      </View>
      <AppText variant="body">
        {mission.progress.toLocaleString()} / {mission.target.toLocaleString()} {mission.unit}
        {mission.completed && ' ✓ 達成'}
      </AppText>
    </Card>
  );
}

function RankingRow({ entry }: { entry: RankingEntry }) {
  return (
    <View style={[styles.rankingRow, entry.isMe && styles.rankingMe]}>
      <AppText variant="heading" style={styles.rankNum}>{entry.rank}</AppText>
      <AppText variant="body" style={{ flex: 1 }}>{entry.displayName}</AppText>
      <AppText variant="body" style={{ fontWeight: '700' }}>{entry.points} pt</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  muted: { color: colors.textMuted },
  missionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  progressTrack: {
    height: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  progressFill: { height: '100%' },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankingMe: { backgroundColor: '#EAF4FF', borderRadius: radii.sm, paddingHorizontal: spacing.sm },
  rankNum: { width: 32, textAlign: 'center', color: colors.primary },
});
