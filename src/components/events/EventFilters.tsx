import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { colors, spacing } from '@/src/theme';
import type { EventCategory, EventSelectionMode } from '@/src/types';

export type CategoryFilter = 'all' | EventCategory;
export type DateFilter = 'all' | 'today' | 'week' | 'month';
export type SelectionFilter = 'all' | EventSelectionMode;

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'health', label: '健康' },
  { value: 'recreation', label: 'レク' },
  { value: 'volunteer', label: 'ボランティア' },
  { value: 'other', label: 'その他' },
];

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'today', label: '今日' },
  { value: 'week', label: '7日以内' },
  { value: 'month', label: '30日以内' },
];

const SELECTION_OPTIONS: { value: SelectionFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'first-come', label: '先着' },
  { value: 'lottery', label: '抽選' },
];

type Props = {
  category: CategoryFilter;
  date: DateFilter;
  selection: SelectionFilter;
  onChangeCategory: (v: CategoryFilter) => void;
  onChangeDate: (v: DateFilter) => void;
  onChangeSelection: (v: SelectionFilter) => void;
};

function Chip<T extends string>({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <AppText variant="caption" style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

export function EventFilters({
  category,
  date,
  selection,
  onChangeCategory,
  onChangeDate,
  onChangeSelection,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.group}>
        <AppText variant="caption" style={styles.groupLabel}>カテゴリ</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {CATEGORY_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              active={category === opt.value}
              onPress={() => onChangeCategory(opt.value)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.group}>
        <AppText variant="caption" style={styles.groupLabel}>開催日</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {DATE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              active={date === opt.value}
              onPress={() => onChangeDate(opt.value)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.group}>
        <AppText variant="caption" style={styles.groupLabel}>募集方法</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {SELECTION_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              active={selection === opt.value}
              onPress={() => onChangeSelection(opt.value)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  group: { gap: spacing.xs },
  groupLabel: { color: colors.textMuted, fontWeight: '700' },
  row: { gap: spacing.xs, paddingRight: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { color: colors.text, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
});
