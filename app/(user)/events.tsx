import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { Card } from '@/src/components/ui/Card';
import { eventsApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';
import type { AppEvent, EventCategory } from '@/src/types';

const CATEGORY_LABEL: Record<EventCategory, string> = {
  health: '健康',
  recreation: 'レクリエーション',
  volunteer: 'ボランティア',
  other: 'その他',
};

const CATEGORY_COLOR: Record<EventCategory, string> = {
  health: '#1E8449',
  recreation: '#2471A3',
  volunteer: '#D35400',
  other: '#717D7E',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`;
}

function EventCard({ event, onPress }: { event: AppEvent; onPress: () => void }) {
  const isPast = event.status !== 'open';
  return (
    <TouchableOpacity onPress={onPress} disabled={false} activeOpacity={0.7}>
      <Card style={[styles.eventCard, isPast && styles.pastCard]}>
        <View style={styles.categoryRow}>
          <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLOR[event.category] }]}>
            <AppText variant="caption" style={styles.categoryText}>
              {CATEGORY_LABEL[event.category]}
            </AppText>
          </View>
          {isPast && (
            <View style={styles.closedBadge}>
              <AppText variant="caption" style={styles.closedText}>終了</AppText>
            </View>
          )}
        </View>
        <AppText variant="heading" style={isPast ? styles.pastTitle : undefined}>
          {event.title}
        </AppText>
        <AppText variant="body" style={styles.detail}>
          {formatDate(event.startAt)}
        </AppText>
        <AppText variant="body" style={styles.detail}>
          {event.location}
        </AppText>
        <View style={styles.pointsRow}>
          <AppText variant="caption" style={styles.points}>
            +{event.pointsAwarded}pt獲得
          </AppText>
          <AppText variant="caption" style={styles.participants}>
            参加者 {event.participantCount}名
            {event.maxParticipants ? `/${event.maxParticipants}名` : ''}
          </AppText>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function EventsScreen() {
  const router = useRouter();
  const kkpId = useAuthStore((s) => s.kkpId);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.listEvents,
    staleTime: 60_000,
  });

  const openEvents = events.filter((e) => e.status === 'open');
  const pastEvents = events.filter((e) => e.status !== 'open');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">イベント一覧</AppText>

        {isLoading ? (
          <AppText variant="body">読み込み中...</AppText>
        ) : (
          <>
            <AppText variant="heading">開催予定</AppText>
            {openEvents.length === 0 ? (
              <AppText variant="body" style={styles.empty}>現在募集中のイベントはありません</AppText>
            ) : (
              openEvents.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  onPress={() => router.push({ pathname: '/(user)/event/[id]', params: { id: evt.id } })}
                />
              ))
            )}

            {pastEvents.length > 0 && (
              <>
                <AppText variant="heading" style={{ marginTop: spacing.md }}>過去のイベント</AppText>
                {pastEvents.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    onPress={() => router.push({ pathname: '/(user)/event/[id]', params: { id: evt.id } })}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  eventCard: { gap: spacing.sm },
  pastCard: { opacity: 0.7 },
  categoryRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  closedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.disabled,
  },
  closedText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  detail: { color: colors.textMuted },
  pastTitle: { color: colors.textMuted },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  points: { color: colors.success, fontWeight: '700' },
  participants: { color: colors.textMuted },
  empty: { color: colors.textMuted },
});
