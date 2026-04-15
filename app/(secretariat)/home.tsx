import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { noticesApi, secretariatAdminApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';

export default function SecretariatHome() {
  const router = useRouter();
  const kkpId = useAuthStore((s) => s.kkpId);

  const pendingQuery = useQuery({
    queryKey: ['secretariat', 'pending-events'],
    queryFn: secretariatAdminApi.listPendingEvents,
    staleTime: 15_000,
  });

  const noticesQuery = useQuery({
    queryKey: ['notices'],
    queryFn: noticesApi.listNotices,
    staleTime: 30_000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">事務局ホーム</AppText>
        <AppText variant="caption">事務局ID: {kkpId}</AppText>

        <Card>
          <AppText variant="heading">承認待ちイベント</AppText>
          <View style={styles.metricRow}>
            <AppText variant="title" style={styles.metricNum}>
              {pendingQuery.data?.length ?? 0}
            </AppText>
            <AppText variant="body" style={styles.metricLabel}>件</AppText>
          </View>
          <AppButton
            label="イベント承認へ"
            onPress={() => router.push('/(secretariat)/events')}
          />
        </Card>

        <Card>
          <AppText variant="heading">お知らせ</AppText>
          <View style={styles.metricRow}>
            <AppText variant="title" style={styles.metricNum}>
              {noticesQuery.data?.length ?? 0}
            </AppText>
            <AppText variant="body" style={styles.metricLabel}>件公開中</AppText>
          </View>
          <AppButton
            label="お知らせ管理へ"
            variant="secondary"
            onPress={() => router.push('/(secretariat)/notices')}
          />
        </Card>

        <AppText variant="body" style={styles.note}>
          事務局では、開催者が登録したイベントの承認・差し戻し、および全ユーザ向けのお知らせ配信を行います。
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  metricRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginVertical: spacing.sm },
  metricNum: { color: colors.primary },
  metricLabel: { color: colors.textMuted },
  note: { color: colors.textMuted },
});
