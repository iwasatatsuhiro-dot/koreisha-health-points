import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { useAccessibilityStore } from '@/src/stores/accessibilityStore';
import { useAuthStore } from '@/src/stores/authStore';
import { pushApi } from '@/src/services/api/endpoints';
import { colors, spacing } from '@/src/theme';

export default function Settings() {
  const router = useRouter();
  const { fontScale, cycleFontScale } = useAccessibilityStore();
  const signOut = useAuthStore((s) => s.signOut);
  const kkpId = useAuthStore((s) => s.kkpId);
  const nickname = useAuthStore((s) => s.nickname);
  const deviceId = useAuthStore((s) => s.deviceId);

  const unread = useQuery({
    queryKey: ['push', kkpId],
    queryFn: () => pushApi.listMessages(kkpId!),
    enabled: !!kkpId,
    select: (data) => data.unread,
    staleTime: 30_000,
  });

  function handleSignOut() {
    signOut();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">設定</AppText>

        <Card>
          <AppText variant="heading">アカウント</AppText>
          <AppText variant="body">KKP-ID: {kkpId}</AppText>
          <AppText variant="body" style={styles.muted}>
            ニックネーム: {nickname ?? '未設定'}
          </AppText>
          <AppButton
            label="ニックネームを変更"
            variant="secondary"
            onPress={() => router.push('/(user)/nickname')}
          />
        </Card>

        <Card>
          <AppText variant="heading">文字サイズ</AppText>
          <AppText variant="body">現在: {Math.round(fontScale * 100)}%</AppText>
          <AppButton label="文字サイズを変更" variant="secondary" onPress={cycleFontScale} />
        </Card>

        <Card>
          <AppText variant="heading">
            通知センター{unread.data ? `（未読 ${unread.data}件）` : ''}
          </AppText>
          <AppText variant="body" style={styles.muted}>
            アプリからの通知履歴と通知設定を確認できます。
          </AppText>
          <AppButton
            label="通知センターを開く"
            variant="secondary"
            onPress={() => router.push('/(user)/notifications')}
          />
        </Card>

        <Card>
          <AppText variant="heading">使い方ガイド</AppText>
          <AppText variant="body" style={styles.muted}>
            アプリの主な使い方をスライドで確認できます。
          </AppText>
          <AppButton
            label="使い方ガイドを開く"
            variant="secondary"
            onPress={() => router.push('/(user)/tutorial?replay=1')}
          />
        </Card>

        <Card>
          <AppText variant="heading">見守り設定</AppText>
          <AppText variant="body" style={styles.muted}>
            一定期間アプリの利用がない場合に、ご家族等にご連絡する設定です。
          </AppText>
          <AppButton
            label="見守り設定を開く"
            variant="secondary"
            onPress={() => router.push('/(user)/watch-over')}
          />
        </Card>

        <Card>
          <AppText variant="heading">お問い合わせ</AppText>
          <AppText variant="body" style={styles.muted}>
            アプリに関するご質問・ご要望は事務局へお問い合わせください。
          </AppText>
          <AppButton
            label="問い合わせフォームを開く"
            variant="secondary"
            onPress={() => router.push('/(user)/inquiry')}
          />
        </Card>

        <Card>
          <AppText variant="heading">ご利用の端末</AppText>
          <AppText variant="body" style={styles.muted}>
            この端末でご利用中です（1つの KKP-ID は1台の端末でのみ利用できます）
          </AppText>
          {deviceId && (
            <AppText variant="caption" style={styles.muted}>
              端末ID: {deviceId.slice(0, 16)}…
            </AppText>
          )}
          <AppText variant="caption" style={styles.muted}>
            機種変更される場合は、新しい端末でアプリをインストールし、登録画面からこの KKP-ID を再登録してください。
          </AppText>
        </Card>

        <Card>
          <AppText variant="heading">利用規約</AppText>
          <AppButton
            label="利用規約を表示"
            variant="secondary"
            onPress={() => router.push('/(user)/terms')}
          />
        </Card>

        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <AppButton label="ログアウト" variant="secondary" onPress={handleSignOut} />
          <AppButton
            label="退会する"
            variant="ghost"
            onPress={() => router.push('/(user)/withdraw')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  muted: { color: colors.textMuted },
});
