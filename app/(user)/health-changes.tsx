import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { healthChangesApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';
import type { HealthChangeDirection, HealthChangeKind, HealthStateChange } from '@/src/types';

const KIND_LABEL: Record<HealthChangeKind, string> = {
  frailty: 'フレイルリスク',
  steps: '歩数',
  blood_pressure: '血圧',
  weight: '体重',
};

const DIRECTION_COLOR: Record<HealthChangeDirection, string> = {
  improved: colors.success,
  worsened: colors.danger,
  stable: colors.accent,
};

const DIRECTION_LABEL: Record<HealthChangeDirection, string> = {
  improved: '改善',
  worsened: '注意',
  stable: '変化',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function HealthChangesScreen() {
  const router = useRouter();
  const kkpId = useAuthStore((s) => s.kkpId)!;

  const { data, isLoading } = useQuery({
    queryKey: ['health-changes', kkpId],
    queryFn: () => healthChangesApi.list(kkpId),
    staleTime: 60_000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">健康状態の変化</AppText>
        <AppText variant="body" style={styles.lead}>
          直近のスナップショットと前回を比較し、大きな変化があった項目をお知らせします。
        </AppText>

        {data?.previousSnapshotAt && data.latestSnapshotAt && (
          <Card style={styles.periodCard}>
            <AppText variant="caption" style={styles.muted}>比較期間</AppText>
            <AppText variant="body">
              {formatDate(data.previousSnapshotAt)} → {formatDate(data.latestSnapshotAt)}
            </AppText>
          </Card>
        )}

        {isLoading ? (
          <AppText variant="body">読み込み中...</AppText>
        ) : !data || data.changes.length === 0 ? (
          <Card>
            <AppText variant="body" style={styles.muted}>
              大きな変化はありません。現状の生活習慣を維持しましょう。
            </AppText>
          </Card>
        ) : (
          data.changes.map((c) => <ChangeCard key={c.id} change={c} />)
        )}

        <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ChangeCard({ change }: { change: HealthStateChange }) {
  const color = DIRECTION_COLOR[change.direction];
  return (
    <Card style={[styles.changeCard, { borderLeftColor: color }]}>
      <View style={styles.changeHeader}>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <AppText variant="caption" style={styles.badgeText}>
            {DIRECTION_LABEL[change.direction]}
          </AppText>
        </View>
        <AppText variant="caption" style={styles.muted}>
          {KIND_LABEL[change.kind]}
        </AppText>
      </View>
      <AppText variant="heading">{change.title}</AppText>
      <AppText variant="body">{change.body}</AppText>
      <AppText variant="caption" style={styles.muted}>
        検出日: {formatDate(change.detectedAt)}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  lead: { color: colors.textMuted },
  muted: { color: colors.textMuted },
  periodCard: { gap: spacing.xs },
  changeCard: {
    gap: spacing.xs,
    borderLeftWidth: 6,
  },
  changeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
