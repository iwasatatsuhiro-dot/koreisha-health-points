import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { inquiriesApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing, typography } from '@/src/theme';
import type { InquiryCategory } from '@/src/types';

const CATEGORIES: Array<{ value: InquiryCategory; label: string }> = [
  { value: 'app', label: 'アプリの不具合' },
  { value: 'points', label: 'ポイントについて' },
  { value: 'event', label: 'イベントについて' },
  { value: 'account', label: 'アカウント・退会' },
  { value: 'other', label: 'その他' },
];

const CATEGORY_LABEL: Record<InquiryCategory, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
) as Record<InquiryCategory, string>;

const STATUS_LABEL: Record<'open' | 'in_progress' | 'resolved', string> = {
  open: '受付済み',
  in_progress: '対応中',
  resolved: '対応完了',
};

export default function InquiryScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { kkpId } = useAuthStore();

  const [category, setCategory] = useState<InquiryCategory>('app');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const history = useQuery({
    queryKey: ['inquiries', kkpId],
    queryFn: () => inquiriesApi.listMine(kkpId!),
    enabled: !!kkpId,
  });

  const submit = useMutation({
    mutationFn: () => inquiriesApi.submit({ kkpId: kkpId!, category, subject, body }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['inquiries', kkpId] });
      setSubject('');
      setBody('');
      Alert.alert('送信完了', `受付番号: ${res.inquiry.id}\n事務局より順次ご連絡いたします。`);
    },
    onError: () => Alert.alert('エラー', '送信に失敗しました。時間をおいて再試行してください。'),
  });

  function handleSubmit() {
    if (!subject.trim()) return Alert.alert('件名を入力してください');
    if (!body.trim()) return Alert.alert('内容を入力してください');
    submit.mutate();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">お問い合わせ</AppText>
        <AppText variant="body" style={styles.muted}>
          アプリに関するご質問・ご要望は以下のフォームからお送りください。
        </AppText>

        <Card>
          <AppText variant="heading">カテゴリ</AppText>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => (
              <AppButton
                key={c.value}
                label={c.label}
                variant={category === c.value ? 'primary' : 'secondary'}
                onPress={() => setCategory(c.value)}
                style={styles.catBtn}
              />
            ))}
          </View>
        </Card>

        <Card>
          <AppText variant="heading">件名</AppText>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="例: ポイントが付与されない"
            placeholderTextColor={colors.textMuted}
          />
        </Card>

        <Card>
          <AppText variant="heading">内容</AppText>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={6}
            placeholder="具体的な内容をご記入ください"
            placeholderTextColor={colors.textMuted}
          />
        </Card>

        <AppButton
          label={submit.isPending ? '送信中...' : '送信する'}
          onPress={handleSubmit}
          disabled={submit.isPending}
        />
        <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />

        {history.data && history.data.length > 0 && (
          <>
            <AppText variant="heading" style={{ marginTop: spacing.md }}>過去の問い合わせ</AppText>
            {history.data.map((inq) => (
              <Card key={inq.id}>
                <View style={styles.historyHead}>
                  <AppText variant="caption" style={styles.muted}>
                    {inq.id} ・ {CATEGORY_LABEL[inq.category]}
                  </AppText>
                  <View style={[styles.statusPill, inq.status === 'resolved' ? styles.resolved : styles.open]}>
                    <AppText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
                      {STATUS_LABEL[inq.status]}
                    </AppText>
                  </View>
                </View>
                <AppText variant="heading">{inq.subject}</AppText>
                <AppText variant="body" style={styles.muted} numberOfLines={3}>{inq.body}</AppText>
                <AppText variant="caption" style={styles.muted}>
                  {new Date(inq.submittedAt).toLocaleString('ja-JP')}
                </AppText>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  muted: { color: colors.textMuted },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catBtn: { flexBasis: '48%', minWidth: 140 },
  input: {
    minHeight: 52,
    fontSize: typography.baseSize,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  multiline: { minHeight: 120, paddingTop: spacing.md, textAlignVertical: 'top' },
  historyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill },
  open: { backgroundColor: colors.accent },
  resolved: { backgroundColor: colors.success },
});
