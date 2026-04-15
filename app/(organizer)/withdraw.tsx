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

export default function OrganizerWithdraw() {
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
        [{ text: 'OK', onPress: () => { signOut(); router.replace('/'); } }],
      );
    },
    onError: () => Alert.alert('エラー', '退会処理に失敗しました。時間をおいて再度お試しください。'),
  });

  function handleWithdraw() {
    Alert.alert(
      '本当に退会しますか？',
      '退会すると、開催者としてのアプリ利用ができなくなります。登録済みのイベント情報は事務局の規程に従って処理されます。',
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
            ・退会すると、開催者として本アプリの利用ができなくなります。{'\n'}
            ・登録済みのイベント情報は事務局の保管規程に従って処理されます。{'\n'}
            ・未開催の抽選イベント等は、事務局にて別途対応となります。{'\n'}
            ・再登録には、事務局への改めての申請が必要となります。
          </AppText>
        </Card>

        <Card>
          <AppText variant="heading">確認事項</AppText>
          <View style={{ marginTop: spacing.sm }}>
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
  warnCard: { borderWidth: 2, borderColor: colors.danger },
  warnTitle: { color: colors.danger },
});
