import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { videosApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing } from '@/src/theme';

export default function VideoDetail() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kkpId } = useAuthStore();

  const video = useQuery({
    queryKey: ['video', id, kkpId],
    queryFn: () => videosApi.getVideo(id!, kkpId!),
    enabled: !!id && !!kkpId,
  });

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const watch = useMutation({
    mutationFn: () => videosApi.markWatched(id!, kkpId!),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['videos', kkpId] });
      qc.invalidateQueries({ queryKey: ['video', id, kkpId] });
      qc.invalidateQueries({ queryKey: ['balance', kkpId] });
      qc.invalidateQueries({ queryKey: ['history', kkpId] });
      Alert.alert('視聴ありがとうございました', `+${res.pointsAwarded}pt を獲得しました`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => {
      Alert.alert('エラー', 'ポイント付与に失敗しました。時間をおいて再試行してください。');
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startPlayback() {
    if (!video.data || playing) return;
    setPlaying(true);
    setElapsed(0);
    // 動画再生はモックのため早送り（1秒=10秒進行）で体感を短く
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 10;
        if (next >= (video.data?.durationSec ?? 0)) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPlaying(false);
          watch.mutate();
          return video.data?.durationSec ?? 0;
        }
        return next;
      });
    }, 1000);
  }

  if (video.isLoading || !video.data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <AppText variant="body">読み込み中...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const v = video.data;
  const alreadyWatched = !!v.watchedAt;
  const progressPct = v.durationSec ? Math.round((elapsed / v.durationSec) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <View style={styles.player}>
            <AppText variant="title" style={{ fontSize: 72, lineHeight: 88 }}>{v.thumbnailEmoji}</AppText>
            {playing && (
              <>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                </View>
                <AppText variant="caption" style={styles.muted}>再生中... {progressPct}%</AppText>
              </>
            )}
          </View>
        </Card>

        <AppText variant="title">{v.title}</AppText>
        <AppText variant="body">{v.description}</AppText>
        <AppText variant="caption" style={styles.muted}>
          視聴時間 {Math.floor(v.durationSec / 60)}分{v.durationSec % 60 > 0 ? ` ${v.durationSec % 60}秒` : ''}
        </AppText>

        {alreadyWatched ? (
          <Card>
            <AppText variant="heading">本日視聴済み</AppText>
            <AppText variant="body" style={styles.muted}>
              この動画は本日すでに視聴済みです。明日また視聴できます。
            </AppText>
          </Card>
        ) : playing ? (
          <AppButton label="再生中..." disabled />
        ) : (
          <AppButton
            label={`視聴を開始（+${v.pointsAwarded}pt）`}
            onPress={startPlayback}
            disabled={watch.isPending}
          />
        )}

        <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.textMuted },
  player: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
  progressTrack: {
    height: 12,
    width: '80%',
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});
