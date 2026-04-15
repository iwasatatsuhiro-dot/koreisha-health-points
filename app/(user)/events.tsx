import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { Card } from '@/src/components/ui/Card';
import { EventFilters, type CategoryFilter, type DateFilter, type SelectionFilter } from '@/src/components/events/EventFilters';
import { EventMapView } from '@/src/components/events/EventMapView';
import { eventsApi } from '@/src/services/api/endpoints';
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

type ViewMode = 'list' | 'map';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function matchesDateFilter(event: AppEvent, filter: DateFilter): boolean {
  if (filter === 'all') return true;
  const start = new Date(event.startAt);
  const now = new Date();
  if (filter === 'today') return isSameDay(start, now);
  const diffDays = (start.getTime() - now.getTime()) / 86_400_000;
  if (filter === 'week') return diffDays >= -1 && diffDays <= 7;
  if (filter === 'month') return diffDays >= -1 && diffDays <= 30;
  return true;
}

function EventCard({ event, onPress }: { event: AppEvent; onPress: () => void }) {
  const isPast = event.status !== 'open';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.eventCard, isPast && styles.pastCard]}>
        <View style={styles.categoryRow}>
          <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLOR[event.category] }]}>
            <AppText variant="caption" style={styles.categoryText}>
              {CATEGORY_LABEL[event.category]}
            </AppText>
          </View>
          {event.selectionMode === 'lottery' && (
            <View style={styles.lotteryBadge}>
              <AppText variant="caption" style={styles.lotteryText}>抽選</AppText>
            </View>
          )}
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

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.listEvents,
    staleTime: 60_000,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selection, setSelection] = useState<SelectionFilter>('all');

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (selection !== 'all' && e.selectionMode !== selection) return false;
      if (!matchesDateFilter(e, dateFilter)) return false;
      return true;
    });
  }, [events, category, dateFilter, selection]);

  const openEvents = filtered.filter((e) => e.status === 'open');
  const pastEvents = filtered.filter((e) => e.status !== 'open');

  const openEventDetail = (evt: AppEvent) =>
    router.push({ pathname: '/(user)/event/[id]', params: { id: evt.id } });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">イベント一覧</AppText>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === 'list' }}
          >
            <AppText variant="body" style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              リスト
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === 'map' }}
          >
            <AppText variant="body" style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
              地図
            </AppText>
          </TouchableOpacity>
        </View>

        <EventFilters
          category={category}
          date={dateFilter}
          selection={selection}
          onChangeCategory={setCategory}
          onChangeDate={setDateFilter}
          onChangeSelection={setSelection}
        />

        {isLoading ? (
          <AppText variant="body">読み込み中...</AppText>
        ) : viewMode === 'map' ? (
          <EventMapView events={openEvents} onPressEvent={openEventDetail} />
        ) : (
          <>
            <AppText variant="heading">
              開催予定（{openEvents.length}件）
            </AppText>
            {openEvents.length === 0 ? (
              <AppText variant="body" style={styles.empty}>条件に合うイベントはありません</AppText>
            ) : (
              openEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} onPress={() => openEventDetail(evt)} />
              ))
            )}

            {pastEvents.length > 0 && (
              <>
                <AppText variant="heading" style={{ marginTop: spacing.md }}>
                  過去のイベント（{pastEvents.length}件）
                </AppText>
                {pastEvents.map((evt) => (
                  <EventCard key={evt.id} event={evt} onPress={() => openEventDetail(evt)} />
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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: { color: colors.textMuted, fontWeight: '700' },
  toggleTextActive: { color: '#fff' },
  eventCard: { gap: spacing.sm },
  pastCard: { opacity: 0.7 },
  categoryRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  lotteryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  lotteryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
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
