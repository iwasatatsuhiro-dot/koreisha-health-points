import { useState } from 'react';
import { ScrollView, StyleSheet, View, Modal, TextInput, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { noticesApi, secretariatAdminApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing, typography } from '@/src/theme';
import type { Notice } from '@/src/types';

type EditorState = {
  mode: 'create' | 'edit';
  id?: string;
  title: string;
  body: string;
  important: boolean;
};

const emptyState = (): EditorState => ({
  mode: 'create',
  title: '',
  body: '',
  important: false,
});

export default function SecretariatNotices() {
  const kkpId = useAuthStore((s) => s.kkpId);
  const qc = useQueryClient();
  const [editor, setEditor] = useState<EditorState | null>(null);

  const noticesQuery = useQuery({
    queryKey: ['notices'],
    queryFn: noticesApi.listNotices,
    staleTime: 10_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['notices'] });

  const createMutation = useMutation({
    mutationFn: (input: { title: string; body: string; important: boolean }) =>
      secretariatAdminApi.createNotice(kkpId!, input),
    onSuccess: () => {
      invalidate();
      setEditor(null);
    },
    onError: () => Alert.alert('エラー', 'お知らせの登録に失敗しました。'),
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; title: string; body: string; important: boolean }) =>
      secretariatAdminApi.updateNotice(kkpId!, args.id, {
        title: args.title,
        body: args.body,
        important: args.important,
      }),
    onSuccess: () => {
      invalidate();
      setEditor(null);
    },
    onError: () => Alert.alert('エラー', 'お知らせの更新に失敗しました。'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => secretariatAdminApi.deleteNotice(kkpId!, id),
    onSuccess: () => invalidate(),
    onError: () => Alert.alert('エラー', 'お知らせの削除に失敗しました。'),
  });

  const openCreate = () => setEditor(emptyState());
  const openEdit = (n: Notice) =>
    setEditor({ mode: 'edit', id: n.id, title: n.title, body: n.body, important: n.important });

  const submit = () => {
    if (!editor) return;
    if (!editor.title.trim()) {
      Alert.alert('タイトルを入力してください');
      return;
    }
    if (!editor.body.trim()) {
      Alert.alert('本文を入力してください');
      return;
    }
    if (editor.mode === 'create') {
      createMutation.mutate({
        title: editor.title.trim(),
        body: editor.body.trim(),
        important: editor.important,
      });
    } else if (editor.id) {
      updateMutation.mutate({
        id: editor.id,
        title: editor.title.trim(),
        body: editor.body.trim(),
        important: editor.important,
      });
    }
  };

  const handleDelete = (n: Notice) => {
    Alert.alert(
      'お知らせを削除しますか？',
      `「${n.title}」を削除します。この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除する', style: 'destructive', onPress: () => deleteMutation.mutate(n.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">お知らせ管理</AppText>
        <AppButton label="新規お知らせ作成" onPress={openCreate} />

        {noticesQuery.data?.map((n) => (
          <Card key={n.id}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <AppText variant="heading">{n.title}</AppText>
                <AppText variant="caption" style={styles.muted}>
                  {new Date(n.publishedAt).toLocaleString('ja-JP')}
                </AppText>
              </View>
              {n.important && (
                <View style={styles.importantBadge}>
                  <AppText variant="caption" style={styles.importantBadgeText}>重要</AppText>
                </View>
              )}
            </View>
            <AppText variant="body" style={styles.body}>{n.body}</AppText>
            <View style={styles.actions}>
              <AppButton label="編集" variant="secondary" onPress={() => openEdit(n)} />
              <AppButton label="削除" variant="ghost" onPress={() => handleDelete(n)} />
            </View>
          </Card>
        ))}
      </ScrollView>

      <Modal
        visible={editor !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setEditor(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText variant="heading">
              {editor?.mode === 'edit' ? 'お知らせ編集' : '新規お知らせ'}
            </AppText>

            <AppText variant="caption">タイトル</AppText>
            <TextInput
              value={editor?.title ?? ''}
              onChangeText={(v) => setEditor((s) => (s ? { ...s, title: v } : s))}
              placeholder="例: 春のキャンペーン開催のお知らせ"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <AppText variant="caption">本文</AppText>
            <TextInput
              value={editor?.body ?? ''}
              onChangeText={(v) => setEditor((s) => (s ? { ...s, body: v } : s))}
              multiline
              placeholder="お知らせ内容を入力"
              placeholderTextColor={colors.textMuted}
              style={styles.textArea}
            />

            <Pressable
              onPress={() => setEditor((s) => (s ? { ...s, important: !s.important } : s))}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, editor?.important && styles.checkboxOn]}>
                {editor?.important && <AppText variant="caption" style={styles.checkboxMark}>✓</AppText>}
              </View>
              <AppText variant="body">重要なお知らせとして表示</AppText>
            </Pressable>

            <View style={styles.modalActions}>
              <AppButton
                label={editor?.mode === 'edit' ? '更新する' : '公開する'}
                onPress={submit}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
              <AppButton label="キャンセル" variant="ghost" onPress={() => setEditor(null)} />
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
  importantBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.danger,
    borderRadius: radii.pill,
  },
  importantBadgeText: { color: '#FFFFFF', fontWeight: '700' },
  body: { marginTop: spacing.sm },
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
    gap: spacing.sm,
  },
  input: {
    minHeight: 48,
    fontSize: typography.baseSize,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  textArea: {
    minHeight: 140,
    fontSize: typography.baseSize,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: '#FFFFFF', fontWeight: '700' },
  modalActions: { gap: spacing.sm, marginTop: spacing.md },
});
