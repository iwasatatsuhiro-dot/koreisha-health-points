import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { secretariatApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing, typography } from '@/src/theme';

export default function NicknameScreen() {
  const router = useRouter();
  const kkpId = useAuthStore((s) => s.kkpId);
  const storedNickname = useAuthStore((s) => s.nickname);
  const setStoreNickname = useAuthStore((s) => s.setNickname);
  const [value, setValue] = useState(storedNickname ?? '');

  const mutation = useMutation({
    mutationFn: (n: string) => secretariatApi.updateNickname(kkpId!, n),
    onSuccess: (data) => {
      setStoreNickname(data.nickname);
      Alert.alert('保存しました', `ニックネーム: ${data.nickname}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => Alert.alert('エラー', '保存に失敗しました。時間をおいて再度お試しください。'),
  });

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) return Alert.alert('ニックネームを入力してください');
    if (trimmed.length > 20) return Alert.alert('ニックネームは20文字以内で入力してください');
    mutation.mutate(trimmed);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">ニックネーム</AppText>
        <AppText variant="body" style={styles.muted}>
          ランキング等で表示される名前です。任意で設定できます（20文字まで）。
        </AppText>

        <Card>
          <AppText variant="heading">ニックネーム</AppText>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="例: さっぽろ太郎"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            maxLength={20}
            accessibilityLabel="ニックネーム入力欄"
          />
          <AppText variant="caption" style={styles.muted}>
            {value.length} / 20 文字
          </AppText>
        </Card>

        <AppButton
          label={mutation.isPending ? '保存中...' : '保存する'}
          onPress={handleSave}
          disabled={mutation.isPending}
        />
        <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  muted: { color: colors.textMuted },
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
});
