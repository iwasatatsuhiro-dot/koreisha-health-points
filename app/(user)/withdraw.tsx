import { useState } from 'react';
import { ScrollView, StyleSheet, Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { secretariatApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';

export default function WithdrawScreen() {
  const router = useRouter();
  const kkpId = useAuthStore((s) => s.kkpId);
  const signOut = useAuthStore((s) => s.signOut);
  const [confirmed, setConfirmed] = useState(false);

  const mutation = useMutation({
    mutationFn: () => secretariatApi.withdraw(kkpId!),
    onSuccess: () => {
      Alert.alert(
        '退会手続きが完了しました',
        'ご利用ありがとうございました。',
        [
          {
            text: 'OK',
            onPress: () => {
              signOut();
              router.replace('/');
            },
          },
        ],
      );
    },
    onError: () => Alert.alert('エラー', '退会処理に失敗しました。時間をおいて再度お試しください。'),
  });

  function handleWithdraw() {
    Alert.alert(
      '本当に退会しますか？',
      '退会すると、獲得したポイントや活動履歴は無効となり、復元できません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '退会する', style: 'destructive', onPress: () => mutation.mutate() },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">退会手続き</AppText>

        <Card style={styles.warnCard}>
          <AppText variant="heading" style={styles.warnTitle}>⚠️ 退会に関する注意</AppText>
          <AppText variant="body">
            ・退会すると、本アプリの利用ができなくなります。{'\n'}
            ・獲得したポイントは失効し、以後のポイント交換はできません。{'\n'}
            ・活動履歴（歩数・イベント参加・動画視聴等）は事務局の保管規程に従って処理されます。{'\n'}
            ・再登録には、札幌市からの新たな対象者通知が必要となります。
          </AppText>
        </Card>

        <Card>
          <AppText variant="heading">確認事項</AppText>
          <View style={styles.checkRow}>
            <AppButton
              label={confirmed ? '✓ 上記内容を確認しました' : '上記内容を確認しました'}
              variant={confirmed ? 'primary' : 'secondary'}
              onPress={() => setConfirmed((v) => !v)}
            />
          </View>
        </Card>

        <AppButton
          label={mutation.isPending ? '退会処理中...' : '退会する'}
          onPress={handleWithdraw}
          disabled={!confirmed || mutation.isPending}
        />
        <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  warnCard: {
    borderWidth: 2,
    borderColor: colors.danger,
  },
  warnTitle: { color: colors.danger },
  checkRow: { marginTop: spacing.sm },
});
