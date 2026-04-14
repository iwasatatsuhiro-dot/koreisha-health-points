import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { Card } from '@/src/components/ui/Card';
import { videosApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing } from '@/src/theme';
import type { HealthVideo, HealthVideoCategory } from '@/src/types';

const CATEGORY_LABELS: Record<HealthVideoCategory, string> = {
  frailty: 'フレイル予防',
  exercise: '運動',
  nutrition: '食事',
  mental: '認知機能',
};

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}分${s > 0 ? `${s}秒` : ''}`;
}

export default function Videos() {
  const router = useRouter();
  const { kkpId } = useAuthStore();

  const videos = useQuery({
    queryKey: ['videos', kkpId],
    queryFn: () => videosApi.listVideos(kkpId!),
    enabled: !!kkpId,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">健康動画</AppText>
        <AppText variant="body" style={styles.muted}>
          動画を視聴するとポイントが貯まります（1日1回まで）。
        </AppText>

        {videos.isLoading && <AppText variant="body">読み込み中...</AppText>}

        {videos.data?.map((v) => (
          <VideoRow key={v.id} video={v} onPress={() => router.push(`/(user)/video/${v.id}`)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function VideoRow({ video, onPress }: { video: HealthVideo; onPress: () => void }) {
  const watched = !!video.watchedAt;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={video.title}>
      <Card>
        <View style={styles.row}>
          <View style={styles.thumb}>
            <AppText variant="title" style={styles.emoji}>{video.thumbnailEmoji}</AppText>
          </View>
          <View style={styles.meta}>
            <AppText variant="heading">{video.title}</AppText>
            <AppText variant="caption" style={styles.muted}>
              {CATEGORY_LABELS[video.category]} ・ {formatDuration(video.durationSec)}
            </AppText>
            <View style={styles.badgeRow}>
              <View style={[styles.pill, watched ? styles.pillDone : styles.pillPts]}>
                <AppText variant="caption" style={{ color: watched ? colors.textMuted : colors.success, fontWeight: '700' }}>
                  {watched ? '本日視聴済み' : `+${video.pointsAwarded}pt`}
                </AppText>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  muted: { color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 40, lineHeight: 48 },
  meta: { flex: 1, gap: spacing.xs },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill },
  pillPts: { backgroundColor: '#E6F4EA' },
  pillDone: { backgroundColor: colors.surface },
});
