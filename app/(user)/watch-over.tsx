import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { secretariatApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';
import type { WatchOverConfig } from '@/src/types';

const ALERT_DAYS = [1, 3, 7, 14] as const;

function formatDateTime(iso: string | null): string {
  if (!iso) return '未記録';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function WatchOverScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const kkpId = useAuthStore((s) => s.kkpId)!;

  const { data: config, isLoading } = useQuery({
    queryKey: ['watch-over', kkpId],
    queryFn: () => secretariatApi.getWatchOver(kkpId),
    staleTime: 30_000,
  });

  const [enabled, setEnabled] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [alertDays, setAlertDays] = useState<WatchOverConfig['inactivityAlertDays']>(3);

  useEffect(() => {
    if (!config) return;
    setEnabled(config.enabled);
    setName(config.emergencyContact?.name ?? '');
    setRelation(config.emergencyContact?.relation ?? '');
    setPhone(config.emergencyContact?.phone ?? '');
    setAlertDays(config.inactivityAlertDays);
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (patch: Partial<WatchOverConfig>) => secretariatApi.updateWatchOver(kkpId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watch-over', kkpId] });
      Alert.alert('保存しました', '見守り設定を更新しました。');
    },
    onError: () => Alert.alert('エラー', '保存に失敗しました。'),
  });

  function handleSave() {
    if (enabled && (!name.trim() || !phone.trim())) {
      Alert.alert('入力不足', '見守りを有効にするには、連絡先の氏名と電話番号が必要です。');
      return;
    }
    saveMutation.mutate({
      enabled,
      emergencyContact:
        name.trim() || phone.trim()
          ? { name: name.trim(), relation: relation.trim(), phone: phone.trim() }
          : null,
      inactivityAlertDays: alertDays,
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">見守り設定</AppText>
        <AppText variant="body" style={styles.lead}>
          一定期間アプリを利用されなかった場合に、登録いただいたご家族や支援者の方にご連絡します。
        </AppText>

        {isLoading ? (
          <AppText variant="body">読み込み中...</AppText>
        ) : (
          <>
            <Card>
              <AppText variant="heading">見守り機能</AppText>
              <View style={styles.toggleRow}>
                <AppButton
                  label={enabled ? '✓ 有効にしています' : '有効にする'}
                  variant={enabled ? 'primary' : 'secondary'}
                  onPress={() => setEnabled((v) => !v)}
                />
              </View>
              {config?.lastActiveAt && (
                <AppText variant="caption" style={styles.muted}>
                  最終利用: {formatDateTime(config.lastActiveAt)}
                </AppText>
              )}
            </Card>

            <Card>
              <AppText variant="heading">緊急連絡先</AppText>
              <View style={styles.field}>
                <AppText variant="caption" style={styles.label}>お名前</AppText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="例: 山田 花子"
                  style={styles.input}
                  maxLength={30}
                />
              </View>
              <View style={styles.field}>
                <AppText variant="caption" style={styles.label}>ご関係</AppText>
                <TextInput
                  value={relation}
                  onChangeText={setRelation}
                  placeholder="例: 長女"
                  style={styles.input}
                  maxLength={20}
                />
              </View>
              <View style={styles.field}>
                <AppText variant="caption" style={styles.label}>電話番号</AppText>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="090-1234-5678"
                  keyboardType="phone-pad"
                  style={styles.input}
                  maxLength={15}
                />
              </View>
            </Card>

            <Card>
              <AppText variant="heading">通知するタイミング</AppText>
              <AppText variant="caption" style={styles.muted}>
                この日数以上アプリ利用がない場合にご連絡します
              </AppText>
              <View style={styles.chipRow}>
                {ALERT_DAYS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, alertDays === d && styles.chipActive]}
                    onPress={() => setAlertDays(d)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: alertDays === d }}
                  >
                    <AppText variant="body" style={[styles.chipText, alertDays === d && styles.chipTextActive]}>
                      {d}日
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            <AppButton
              label={saveMutation.isPending ? '保存中...' : '保存する'}
              onPress={handleSave}
              disabled={saveMutation.isPending}
            />
            <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  lead: { color: colors.textMuted },
  toggleRow: { marginTop: spacing.sm },
  muted: { color: colors.textMuted, marginTop: spacing.xs },
  field: { gap: spacing.xs, marginTop: spacing.sm },
  label: { color: colors.textMuted, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
});
