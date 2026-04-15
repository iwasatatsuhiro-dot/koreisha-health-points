import { useEffect } from 'react';
import { ScrollView, StyleSheet, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { pushApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing } from '@/src/theme';
import type { PushCategory, PushMessage, PushPreferences } from '@/src/types';

const CATEGORY_LABEL: Record<PushCategory, string> = {
  event_reminder: 'イベントリマインダ',
  notice: 'お知らせ',
  lottery_result: '抽選結果',
  achievement: '目標達成・ポイント',
  system: 'システム',
};

export default function Notifications() {
  const router = useRouter();
  const qc = useQueryClient();
  const { kkpId } = useAuthStore();

  const messages = useQuery({
    queryKey: ['push', kkpId],
    queryFn: () => pushApi.listMessages(kkpId!),
    enabled: !!kkpId,
  });

  const prefs = useQuery({
    queryKey: ['push-prefs', kkpId],
    queryFn: () => pushApi.getPreferences(kkpId!),
    enabled: !!kkpId,
  });

  const markRead = useMutation({
    mutationFn: (id?: string) => pushApi.markRead(kkpId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['push', kkpId] }),
  });

  const updatePrefs = useMutation({
    mutationFn: (patch: Partial<PushPreferences>) => pushApi.updatePreferences(kkpId!, patch),
    onSuccess: (data) => qc.setQueryData(['push-prefs', kkpId], data),
  });

  useEffect(() => {
    if (messages.data && messages.data.unread > 0) {
      markRead.mutate(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.data?.unread]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">通知センター</AppText>

        <Card>
          <View style={styles.headRow}>
            <AppText variant="heading">通知の受信設定</AppText>
          </View>
          {prefs.data && (
            <>
              <View style={styles.prefRow}>
                <AppText variant="body" style={{ flex: 1 }}>プッシュ通知を受け取る</AppText>
                <Switch
                  value={prefs.data.enabled}
                  onValueChange={(v) => updatePrefs.mutate({ enabled: v })}
                />
              </View>
              {prefs.data.enabled &&
                (Object.keys(CATEGORY_LABEL) as PushCategory[]).map((c) => (
                  <View key={c} style={styles.prefRow}>
                    <AppText variant="body" style={{ flex: 1 }}>{CATEGORY_LABEL[c]}</AppText>
                    <Switch
                      value={prefs.data.categories[c]}
                      onValueChange={(v) =>
                        updatePrefs.mutate({ categories: { ...prefs.data.categories, [c]: v } })
                      }
                    />
                  </View>
                ))}
            </>
          )}
        </Card>

        <AppText variant="heading">通知履歴</AppText>
        {messages.isLoading && <AppText variant="body">読み込み中...</AppText>}
        {messages.data?.messages.length === 0 && (
          <AppText variant="body" style={styles.muted}>通知はまだありません。</AppText>
        )}
        {messages.data?.messages.map((m) => <MessageRow key={m.id} msg={m} />)}

        <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MessageRow({ msg }: { msg: PushMessage }) {
  return (
    <Card>
      <View style={styles.msgHead}>
        <View style={[styles.catPill, styles[`cat_${msg.category}`]]}>
          <AppText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
            {CATEGORY_LABEL[msg.category]}
          </AppText>
        </View>
        <AppText variant="caption" style={styles.muted}>
          {new Date(msg.sentAt).toLocaleString('ja-JP')}
        </AppText>
      </View>
      <AppText variant="heading">{msg.title}</AppText>
      <AppText variant="body">{msg.body}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  muted: { color: colors.textMuted },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  msgHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  catPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill },
  cat_event_reminder: { backgroundColor: colors.primary },
  cat_notice: { backgroundColor: colors.accent },
  cat_lottery_result: { backgroundColor: colors.success },
  cat_achievement: { backgroundColor: colors.success },
  cat_system: { backgroundColor: colors.textMuted },
});
