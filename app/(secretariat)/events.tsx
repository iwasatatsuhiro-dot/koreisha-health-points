import { useState } from 'react';
import { ScrollView, StyleSheet, View, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { secretariatAdminApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing, typography } from '@/src/theme';
import type { AppEvent } from '@/src/types';

export default function SecretariatEvents() {
  const kkpId = useAuthStore((s) => s.kkpId);
  const qc = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ['secretariat', 'pending-events'],
    queryFn: secretariatAdminApi.listPendingEvents,
    staleTime: 10_000,
  });

  const [rejectTarget, setRejectTarget] = useState<AppEvent | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const approveMutation = useMutation({
    mutationFn: (eventId: string) => secretariatAdminApi.approveEvent(eventId, kkpId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secretariat', 'pending-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => Alert.alert('エラー', '承認に失敗しました。再度お試しください。'),
  });

  const rejectMutation = useMutation({
    mutationFn: (args: { eventId: string; reason: string }) =>
      secretariatAdminApi.rejectEvent(args.eventId, kkpId!, args.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secretariat', 'pending-events'] });
      setRejectTarget(null);
      setRejectReason('');
    },
    onError: () => Alert.alert('エラー', '差し戻しに失敗しました。再度お試しください。'),
  });

  const handleApprove = (evt: AppEvent) => {
    Alert.alert(
      'イベントを承認しますか？',
      `「${evt.title}」を承認し、参加者へ公開します。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '承認する', onPress: () => approveMutation.mutate(evt.id) },
      ],
    );
  };

  const submitReject = () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      Alert.alert('差し戻し理由を入力してください');
      return;
    }
    rejectMutation.mutate({ eventId: rejectTarget.id, reason: rejectReason.trim() });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">イベント承認</AppText>
        <AppText variant="caption" style={styles.muted}>
          開催者から登録された承認待ちイベントを確認し、承認または差し戻しを行います。
        </AppText>

        {pendingQuery.isLoading && <AppText variant="body">読み込み中...</AppText>}

        {pendingQuery.data && pendingQuery.data.length === 0 && (
          <Card>
            <AppText variant="body">現在、承認待ちのイベントはありません。</AppText>
          </Card>
        )}

        {pendingQuery.data?.map((evt) => (
          <Card key={evt.id}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <AppText variant="heading">{evt.title}</AppText>
                <AppText variant="caption" style={styles.muted}>
                  {evt.organizerName} ({evt.organizerId})
                </AppText>
              </View>
              <View style={styles.pendingBadge}>
                <AppText variant="caption" style={styles.pendingBadgeText}>承認待ち</AppText>
              </View>
            </View>

            <View style={styles.row}>
              <AppText variant="caption" style={styles.label}>開催日:</AppText>
              <AppText variant="body">
                {new Date(evt.startAt).toLocaleDateString('ja-JP')}
              </AppText>
            </View>
            <View style={styles.row}>
              <AppText variant="caption" style={styles.label}>会場:</AppText>
              <AppText variant="body">{evt.location}</AppText>
            </View>
            <View style={styles.row}>
              <AppText variant="caption" style={styles.label}>カテゴリ:</AppText>
              <AppText variant="body">{evt.category}</AppText>
            </View>
            <View style={styles.row}>
              <AppText variant="caption" style={styles.label}>付与ポイント:</AppText>
              <AppText variant="body">{evt.pointsAwarded} pt</AppText>
            </View>
            <View style={styles.row}>
              <AppText variant="caption" style={styles.label}>定員:</AppText>
              <AppText variant="body">
                {evt.maxParticipants ? `${evt.maxParticipants}名` : '制限なし'}
              </AppText>
            </View>

            <AppText variant="body" style={styles.description}>
              {evt.description}
            </AppText>

            <View style={styles.actions}>
              <AppButton
                label="承認する"
                onPress={() => handleApprove(evt)}
                disabled={approveMutation.isPending}
              />
              <AppButton
                label="差し戻し"
                variant="secondary"
                onPress={() => {
                  setRejectTarget(evt);
                  setRejectReason('');
                }}
              />
            </View>
          </Card>
        ))}
      </ScrollView>

      <Modal
        visible={rejectTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setRejectTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText variant="heading">差し戻し理由</AppText>
            <AppText variant="caption" style={styles.muted}>
              {rejectTarget?.title}
            </AppText>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              placeholder="例: 開催日時に誤りがあります。修正のうえ再申請してください。"
              placeholderTextColor={colors.textMuted}
              style={styles.textArea}
            />
            <View style={styles.modalActions}>
              <AppButton
                label="差し戻す"
                onPress={submitReject}
                disabled={rejectMutation.isPending}
              />
              <AppButton
                label="キャンセル"
                variant="ghost"
                onPress={() => setRejectTarget(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  muted: { color: colors.textMuted },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  pendingBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#FEF3C7',
    borderRadius: radii.pill,
  },
  pendingBadgeText: { color: '#92400E', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  label: { color: colors.textMuted, minWidth: 96 },
  description: { marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  textArea: {
    minHeight: 120,
    fontSize: typography.baseSize,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    textAlignVertical: 'top',
  },
  modalActions: { gap: spacing.sm },
});
