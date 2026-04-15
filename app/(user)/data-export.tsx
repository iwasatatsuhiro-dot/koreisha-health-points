import { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import {
  healthApi,
  secretariatApi,
} from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';
import { buildCsv, makeExportFilename, type CsvRow } from '@/src/utils/csv';
import type { PointHistory, StepsDaily, VitalReading } from '@/src/types';

type ExportKind = 'points' | 'steps' | 'vitals' | 'all';

const KIND_LABEL: Record<ExportKind, string> = {
  points: 'ポイント履歴',
  steps: '歩数履歴（週間）',
  vitals: 'バイタル記録',
  all: '全データ統合',
};

function pointsToCsv(list: PointHistory[]): string {
  const rows: CsvRow[] = list.map((h) => [
    h.recordedAt,
    h.category,
    h.delta,
    h.note,
  ]);
  return buildCsv(['日時', 'カテゴリ', '増減', '備考'], rows);
}

function stepsToCsv(days: StepsDaily[]): string {
  const rows: CsvRow[] = days.map((d) => [d.date, d.count, d.goal]);
  return buildCsv(['日付', '歩数', '目標'], rows);
}

function vitalsToCsv(list: VitalReading[]): string {
  const rows: CsvRow[] = list.map((v) => [
    v.recordedAt,
    v.type,
    v.systolic ?? '',
    v.diastolic ?? '',
    v.bpm ?? '',
    v.celsius ?? '',
    v.weightKg ?? '',
  ]);
  return buildCsv(
    ['日時', '種別', '収縮期', '拡張期', '心拍(bpm)', '体温(℃)', '体重(kg)'],
    rows,
  );
}

function buildCombined(
  points: PointHistory[],
  steps: StepsDaily[],
  vitals: VitalReading[],
): string {
  return [
    '# ポイント履歴',
    pointsToCsv(points),
    '',
    '# 歩数履歴（週間）',
    stepsToCsv(steps),
    '',
    '# バイタル記録',
    vitalsToCsv(vitals),
  ].join('\r\n');
}

export default function DataExportScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const kkpId = useAuthStore((s) => s.kkpId)!;
  const [busy, setBusy] = useState<ExportKind | null>(null);

  async function handleExport(kind: ExportKind) {
    if (busy) return;
    setBusy(kind);
    try {
      let csv = '';
      if (kind === 'points') {
        const history = await qc.fetchQuery({
          queryKey: ['history', kkpId],
          queryFn: () => secretariatApi.getHistory(kkpId),
        });
        csv = pointsToCsv(history);
      } else if (kind === 'steps') {
        const weekly = await qc.fetchQuery({
          queryKey: ['steps-weekly', kkpId],
          queryFn: () => healthApi.getWeeklySteps(kkpId),
        });
        csv = stepsToCsv(weekly.days);
      } else if (kind === 'vitals') {
        const vitals = await qc.fetchQuery({
          queryKey: ['vitals', kkpId],
          queryFn: () => healthApi.listVitals(kkpId),
        });
        csv = vitalsToCsv(vitals);
      } else {
        const [history, weekly, vitals] = await Promise.all([
          qc.fetchQuery({ queryKey: ['history', kkpId], queryFn: () => secretariatApi.getHistory(kkpId) }),
          qc.fetchQuery({ queryKey: ['steps-weekly', kkpId], queryFn: () => healthApi.getWeeklySteps(kkpId) }),
          qc.fetchQuery({ queryKey: ['vitals', kkpId], queryFn: () => healthApi.listVitals(kkpId) }),
        ]);
        csv = buildCombined(history, weekly.days, vitals);
      }

      const filename = makeExportFilename(kind, kkpId);
      await Share.share({
        message: csv,
        title: filename,
      });
    } catch {
      Alert.alert('エラー', 'エクスポートに失敗しました。');
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">データエクスポート</AppText>
        <AppText variant="body" style={styles.lead}>
          記録したデータを CSV 形式で書き出します。共有シートから
          メール・クラウドストレージなどへ保存できます。
        </AppText>

        {(['points', 'steps', 'vitals', 'all'] as const).map((k) => (
          <Card key={k}>
            <AppText variant="heading">{KIND_LABEL[k]}</AppText>
            <AppText variant="body" style={styles.muted}>
              {k === 'points' && 'これまでのポイント獲得・交換の履歴です。'}
              {k === 'steps' && '直近1週間の歩数記録（日毎）です。'}
              {k === 'vitals' && '血圧・心拍・体温・体重の記録です。'}
              {k === 'all' && 'ポイント・歩数・バイタルをまとめて書き出します。'}
            </AppText>
            <AppButton
              label={busy === k ? '書き出し中...' : `${KIND_LABEL[k]}を書き出す`}
              onPress={() => handleExport(k)}
              disabled={busy !== null}
            />
          </Card>
        ))}

        <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  lead: { color: colors.textMuted },
  muted: { color: colors.textMuted },
});
