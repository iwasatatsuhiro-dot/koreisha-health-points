import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { badgesApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing } from '@/src/theme';
import type { BadgeStatus } from '@/src/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function BadgesScreen() {
  const router = useRouter();
  const kkpId = useAuthStore((s) => s.kkpId)!;

  const { data, isLoading } = useQuery({
    queryKey: ['badges', kkpId],
    queryFn: () => badgesApi.list(kkpId),
    staleTime: 60_000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">バッジコレクション</AppText>
        <AppText variant="body" style={styles.lead}>
          歩数・バイタル記録・イベント参加・動画視聴・アンケート回答で達成できるバッジです。
        </AppText>

        {data && (
          <Card style={styles.summaryCard}>
            <AppText variant="heading">
              獲得状況 {data.unlockedCount} / {data.totalCount}
            </AppText>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(data.unlockedCount / data.totalCount) * 100}%` },
                ]}
              />
            </View>
          </Card>
        )}

        {isLoading && <AppText variant="body">読み込み中...</AppText>}

        {data?.badges.map((b) => <BadgeCard key={b.badge.id} status={b} />)}

        <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

function BadgeCard({ status }: { status: BadgeStatus }) {
  const { badge, progress, unlocked, unlockedAt } = status;
  const pct = Math.min(100, Math.round((progress / badge.target) * 100));
  return (
    <Card style={[styles.badgeCard, unlocked ? styles.unlocked : styles.locked]}>
      <View style={styles.badgeRow}>
        <AppText style={[styles.emoji, !unlocked && styles.emojiLocked]}>{badge.emoji}</AppText>
        <View style={styles.badgeInfo}>
          <View style={styles.badgeHeader}>
            <AppText variant="heading" style={!unlocked && styles.lockedText}>
              {badge.title}
            </AppText>
            {unlocked && (
              <View style={styles.unlockedTag}>
                <AppText variant="caption" style={styles.unlockedTagText}>獲得</AppText>
              </View>
            )}
          </View>
          <AppText variant="body" style={styles.muted}>{badge.description}</AppText>
          <View style={styles.progressTrackSm}>
            <View style={[styles.progressFillSm, { width: `${pct}%` }]} />
          </View>
          <AppText variant="caption" style={styles.muted}>
            {progress.toLocaleString()} / {badge.target.toLocaleString()}
            {unlockedAt && `  ・ 獲得日: ${formatDate(unlockedAt)}`}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  lead: { color: colors.textMuted },
  muted: { color: colors.textMuted },
  summaryCard: { gap: spacing.sm },
  progressTrack: {
    height: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  progressTrackSm: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFillSm: { height: '100%', backgroundColor: colors.accent },
  badgeCard: { gap: spacing.sm },
  unlocked: { borderLeftWidth: 6, borderLeftColor: colors.success },
  locked: { borderLeftWidth: 6, borderLeftColor: colors.border, opacity: 0.85 },
  badgeRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  emoji: { fontSize: 44, lineHeight: 52 },
  emojiLocked: { opacity: 0.4 },
  badgeInfo: { flex: 1, gap: spacing.xs },
  badgeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lockedText: { color: colors.textMuted },
  unlockedTag: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  unlockedTagText: { color: '#fff', fontWeight: '700' },
});
