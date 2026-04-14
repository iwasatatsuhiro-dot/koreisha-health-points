import { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { noticesApi, surveysApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing, typography } from '@/src/theme';
import type { Notice, Survey, SurveyQuestion } from '@/src/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

// ── アンケートモーダル ────────────────────────────────────────────────────────

function SurveyModal({
  survey,
  kkpId,
  onClose,
}: {
  survey: Survey;
  kkpId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  function toggleOption(qId: string, option: string, type: 'single' | 'multi') {
    if (type === 'single') {
      setAnswers((prev) => ({ ...prev, [qId]: option }));
    } else {
      setAnswers((prev) => {
        const current = (prev[qId] as string[]) ?? [];
        const next = current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option];
        return { ...prev, [qId]: next };
      });
    }
  }

  const mutation = useMutation({
    mutationFn: () => surveysApi.submitAnswer(survey.id, kkpId, answers),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['surveys', kkpId] });
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['history'] });
      onClose();
      Alert.alert('回答完了', `${data.pointsAwarded}ptを獲得しました！ご協力ありがとうございます。`);
    },
    onError: (err: any) => {
      if (err?.response?.data?.error === 'already_answered') {
        Alert.alert('回答済み', 'このアンケートにはすでに回答済みです。');
        onClose();
      } else {
        Alert.alert('エラー', '送信に失敗しました。');
      }
    },
  });

  function isAnswered(q: SurveyQuestion): boolean {
    const ans = answers[q.id];
    if (q.type === 'text') return typeof ans === 'string' && ans.trim().length > 0;
    if (q.type === 'single') return typeof ans === 'string' && ans.length > 0;
    return Array.isArray(ans) && ans.length > 0;
  }

  const allAnswered = survey.questions.every(isAnswered);

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.surveyContainer}>
          <AppText variant="title">{survey.title}</AppText>
          <AppText variant="body" style={styles.surveyDesc}>{survey.description}</AppText>
          <AppText variant="caption" style={styles.surveyPoints}>
            回答で {survey.pointsAwarded}pt 獲得！
          </AppText>

          {survey.questions.map((q, qi) => (
            <Card key={q.id} style={styles.questionCard}>
              <AppText variant="heading">
                Q{qi + 1}. {q.text}
              </AppText>

              {q.type === 'text' ? (
                <TextInput
                  style={styles.textAnswer}
                  multiline
                  numberOfLines={3}
                  placeholder="ご自由にお書きください"
                  placeholderTextColor={colors.textMuted}
                  value={(answers[q.id] as string) ?? ''}
                  onChangeText={(t) => setAnswers((prev) => ({ ...prev, [q.id]: t }))}
                />
              ) : (
                <View style={styles.options}>
                  {q.options?.map((opt) => {
                    const isSelected =
                      q.type === 'single'
                        ? answers[q.id] === opt
                        : ((answers[q.id] as string[]) ?? []).includes(opt);
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.optionBtn, isSelected && styles.optionSelected]}
                        onPress={() => toggleOption(q.id, opt, q.type as 'single' | 'multi')}
                        activeOpacity={0.7}
                      >
                        <AppText
                          variant="body"
                          style={[styles.optionText, isSelected && styles.optionTextSelected]}
                        >
                          {opt}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Card>
          ))}

          <AppButton
            label={mutation.isPending ? '送信中...' : '回答を送信する'}
            onPress={() => mutation.mutate()}
            disabled={!allAnswered || mutation.isPending}
          />
          <AppButton label="キャンセル" variant="secondary" onPress={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── メイン ────────────────────────────────────────────────────────────────────

export default function NoticesScreen() {
  const kkpId = useAuthStore((s) => s.kkpId)!;
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  const { data: notices = [] } = useQuery({
    queryKey: ['notices'],
    queryFn: noticesApi.listNotices,
    staleTime: 60_000,
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys', kkpId],
    queryFn: () => surveysApi.listSurveys(kkpId),
    staleTime: 60_000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">お知らせ</AppText>

        {/* アンケート */}
        {surveys.filter((s) => !s.answeredAt).length > 0 && (
          <>
            <AppText variant="heading">アンケート</AppText>
            {surveys
              .filter((s) => !s.answeredAt)
              .map((survey) => (
                <TouchableOpacity
                  key={survey.id}
                  onPress={() => setSelectedSurvey(survey)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.surveyCard}>
                    <View style={styles.surveyBadgeRow}>
                      <View style={styles.surveyBadge}>
                        <AppText variant="caption" style={styles.surveyBadgeText}>アンケート</AppText>
                      </View>
                      <AppText variant="caption" style={styles.surveyPoints2}>
                        +{survey.pointsAwarded}pt
                      </AppText>
                    </View>
                    <AppText variant="heading">{survey.title}</AppText>
                    <AppText variant="body" style={styles.surveyDescShort}>
                      {survey.description}
                    </AppText>
                    <AppText variant="caption" style={styles.surveyExpiry}>
                      回答期限: {formatDate(survey.expiresAt)}
                    </AppText>
                  </Card>
                </TouchableOpacity>
              ))}
          </>
        )}

        {/* お知らせ一覧 */}
        <AppText variant="heading">最新情報</AppText>
        {notices.map((notice) => (
          <TouchableOpacity
            key={notice.id}
            onPress={() => setSelectedNotice(notice)}
            activeOpacity={0.7}
          >
            <Card style={[styles.noticeCard, notice.important && styles.importantCard]}>
              {notice.important && (
                <View style={styles.importantBadge}>
                  <AppText variant="caption" style={styles.importantText}>重要</AppText>
                </View>
              )}
              <AppText variant="heading">{notice.title}</AppText>
              <AppText variant="caption" style={styles.noticeDate}>
                {formatDate(notice.publishedAt)}
              </AppText>
            </Card>
          </TouchableOpacity>
        ))}

        {notices.length === 0 && (
          <AppText variant="body" style={styles.empty}>お知らせはありません</AppText>
        )}
      </ScrollView>

      {/* お知らせ詳細モーダル */}
      {selectedNotice && (
        <Modal animationType="slide" onRequestClose={() => setSelectedNotice(null)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={styles.detailContainer}>
              {selectedNotice.important && (
                <View style={[styles.importantBadge, { alignSelf: 'flex-start' }]}>
                  <AppText variant="caption" style={styles.importantText}>重要</AppText>
                </View>
              )}
              <AppText variant="title">{selectedNotice.title}</AppText>
              <AppText variant="caption" style={styles.noticeDate}>
                {formatDate(selectedNotice.publishedAt)}
              </AppText>
              <AppText variant="body" style={styles.noticeBody}>
                {selectedNotice.body}
              </AppText>
              <AppButton label="閉じる" variant="secondary" onPress={() => setSelectedNotice(null)} />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* アンケートモーダル */}
      {selectedSurvey && (
        <SurveyModal
          survey={selectedSurvey}
          kkpId={kkpId}
          onClose={() => setSelectedSurvey(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  // Survey
  surveyCard: { gap: spacing.sm, borderLeftWidth: 4, borderLeftColor: colors.accent },
  surveyBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  surveyBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  surveyBadgeText: { color: '#fff', fontWeight: '700' },
  surveyPoints2: { color: colors.success, fontWeight: '700' },
  surveyDescShort: { color: colors.textMuted },
  surveyExpiry: { color: colors.textMuted },
  // Notice
  noticeCard: { gap: spacing.xs },
  importantCard: { borderLeftWidth: 4, borderLeftColor: colors.danger },
  importantBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  importantText: { color: '#fff', fontWeight: '700' },
  noticeDate: { color: colors.textMuted },
  empty: { color: colors.textMuted },
  // Detail modal
  detailContainer: { padding: spacing.lg, gap: spacing.md },
  noticeBody: { lineHeight: 26 },
  // Survey modal
  surveyContainer: { padding: spacing.lg, gap: spacing.md },
  surveyDesc: { color: colors.textMuted },
  surveyPoints: { color: colors.success, fontWeight: '700' },
  questionCard: { gap: spacing.md },
  options: { gap: spacing.sm },
  optionBtn: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: '#EBF2FB' },
  optionText: {},
  optionTextSelected: { color: colors.primary, fontWeight: '700' },
  textAnswer: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.baseSize,
    minHeight: 80,
  },
});
