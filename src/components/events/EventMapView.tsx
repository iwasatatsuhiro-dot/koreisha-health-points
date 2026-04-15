import { useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Card } from '@/src/components/ui/Card';
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

// 札幌中心部の大まかな矩形 (地図用の正規化範囲)
const BOUNDS = { minLat: 43.00, maxLat: 43.12, minLng: 141.28, maxLng: 141.45 };
const MAP_HEIGHT = 320;

function normalize(lat: number, lng: number) {
  const x = (lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng);
  const y = 1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat);
  return {
    left: `${Math.max(4, Math.min(96, x * 100))}%`,
    top: `${Math.max(4, Math.min(92, y * 100))}%`,
  } as const;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`;
}

type Props = {
  events: AppEvent[];
  onPressEvent: (event: AppEvent) => void;
};

export function EventMapView({ events, onPressEvent }: Props) {
  const mappable = useMemo(
    () => events.filter((e) => typeof e.latitude === 'number' && typeof e.longitude === 'number'),
    [events],
  );
  const [selectedId, setSelectedId] = useState<string | null>(mappable[0]?.id ?? null);
  const selected = mappable.find((e) => e.id === selectedId) ?? null;

  if (mappable.length === 0) {
    return (
      <Card>
        <AppText variant="body" style={styles.empty}>
          表示できるイベントがありません
        </AppText>
      </Card>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.mapArea}>
        <View style={styles.gridHorizontal} />
        <View style={styles.gridVertical} />
        <AppText variant="caption" style={styles.mapLabel}>
          札幌市中心部
        </AppText>
        {mappable.map((evt) => {
          const pos = normalize(evt.latitude!, evt.longitude!);
          const active = selectedId === evt.id;
          return (
            <TouchableOpacity
              key={evt.id}
              style={[styles.pin, pos, { backgroundColor: CATEGORY_COLOR[evt.category] }, active && styles.pinActive]}
              onPress={() => setSelectedId(evt.id)}
              accessibilityLabel={`${evt.title} の地図ピン`}
              accessibilityRole="button"
            >
              <AppText variant="caption" style={styles.pinText}>
                ●
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {selected && (
        <TouchableOpacity onPress={() => onPressEvent(selected)} activeOpacity={0.7}>
          <Card style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={[styles.badge, { backgroundColor: CATEGORY_COLOR[selected.category] }]}>
                <AppText variant="caption" style={styles.badgeText}>
                  {CATEGORY_LABEL[selected.category]}
                </AppText>
              </View>
              <AppText variant="caption" style={styles.tapHint}>
                タップで詳細
              </AppText>
            </View>
            <AppText variant="heading">{selected.title}</AppText>
            <AppText variant="body" style={styles.muted}>
              {formatDate(selected.startAt)}
            </AppText>
            <AppText variant="body" style={styles.muted}>
              {selected.location}
            </AppText>
            <AppText variant="caption" style={styles.points}>
              +{selected.pointsAwarded}pt獲得
            </AppText>
          </Card>
        </TouchableOpacity>
      )}

      <AppText variant="caption" style={styles.note}>
        ※ ピンの位置は相対位置を示す簡易表示です
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  mapArea: {
    height: MAP_HEIGHT,
    backgroundColor: '#E8F0F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  gridHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: '#C8D5DC',
  },
  gridVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: '#C8D5DC',
  },
  mapLabel: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    color: colors.textMuted,
  },
  pin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  pinActive: {
    transform: [{ translateX: -20 }, { translateY: -20 }, { scale: 1.25 }],
    borderColor: colors.accent,
    borderWidth: 3,
  },
  pinText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  detailCard: { gap: spacing.xs },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  tapHint: { color: colors.textMuted },
  muted: { color: colors.textMuted },
  points: { color: colors.success, fontWeight: '700' },
  empty: { color: colors.textMuted, textAlign: 'center' },
  note: { color: colors.textMuted, textAlign: 'center' },
});
