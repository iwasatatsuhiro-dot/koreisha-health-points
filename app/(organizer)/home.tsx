import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { eventsApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';

export default function OrganizerHome() {
  const router = useRouter();
  const { kkpId } = useAuthStore();

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.listEvents,
    staleTime: 30_000,
    select: (evts) => ({
      open: evts.filter((e) => e.organizerId === kkpId && e.status === 'open'),
      total: evts.filter((e) => e.organizerId === kkpId).length,
    }),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">イベント開催者ホーム</AppText>
        <AppText variant="caption">開催者ID: {kkpId}</AppText>

        {/* イベント概要 */}
        <Card>
          <AppText variant="heading">イベント状況</AppText>
          {eventsQuery.data && (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <AppText variant="title" style={styles.statNum}>
                  {eventsQuery.data.open.length}
                </AppText>
                <AppText variant="caption" style={styles.statLabel}>開催予定</AppText>
              </View>
              <View style={styles.stat}>
                <AppText variant="title" style={styles.statNum}>
                  {eventsQuery.data.total}
                </AppText>
                <AppText variant="caption" style={styles.statLabel}>累計登録</AppText>
              </View>
              <View style={styles.stat}>
                <AppText variant="title" style={styles.statNum}>
                  {eventsQuery.data.open.reduce((s, e) => s + e.participantCount, 0)}
                </AppText>
                <AppText variant="caption" style={styles.statLabel}>参加者計</AppText>
              </View>
            </View>
          )}
          <AppButton label="イベント管理へ" onPress={() => router.push('/(organizer)/events')} />
        </Card>

        {/* 開催予定イベント */}
        {eventsQuery.data?.open && eventsQuery.data.open.length > 0 && (
          <Card>
            <AppText variant="heading">直近のイベント</AppText>
            {eventsQuery.data.open.slice(0, 3).map((evt) => (
              <View key={evt.id} style={styles.eventRow}>
                <View style={styles.eventInfo}>
                  <AppText variant="body" style={styles.eventTitle}>{evt.title}</AppText>
                  <AppText variant="caption" style={styles.eventMeta}>
                    {new Date(evt.startAt).getMonth() + 1}月{new Date(evt.startAt).getDate()}日 · {evt.location}
                  </AppText>
                </View>
                <AppText variant="caption" style={styles.participants}>
                  {evt.participantCount}名
                </AppText>
              </View>
            ))}
          </Card>
        )}

        <AppText variant="body" style={styles.note}>
          イベント情報の登録・QRコード発行・参加者のQR読取によるポイント付与は「イベント管理」タブから行います。
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: spacing.sm },
  stat: { alignItems: 'center', gap: spacing.xs },
  statNum: { color: colors.accent },
  statLabel: { color: colors.textMuted },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  eventInfo: { flex: 1 },
  eventTitle: {},
  eventMeta: { color: colors.textMuted },
  participants: { color: colors.success, fontWeight: '700' },
  note: { color: colors.textMuted },
});
