import { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { secretariatApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing, typography } from '@/src/theme';

export default function Register() {
  const [kkpId, setKkpId] = useState('');
  const setSession = useAuthStore((s) => s.setSession);

  const mutation = useMutation({
    mutationFn: (id: string) => secretariatApi.registerUser(id),
    onSuccess: (profile) => {
      setSession({ kkpId: profile.kkpId, role: profile.role });
      const dest = profile.role === 'organizer' ? '/(organizer)/home' : '/(user)/home';
      router.replace(dest);
    },
    onError: () => {
      Alert.alert('登録できませんでした', 'KKP-ID をご確認のうえ再度お試しください。');
    },
  });

  const onSubmit = () => {
    const trimmed = kkpId.trim();
    if (!trimmed) {
      Alert.alert('KKP-ID を入力してください');
      return;
    }
    mutation.mutate(trimmed);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">ユーザ登録</AppText>
        <AppText variant="body">
          お手元の通知に記載の QR コードを読み取るか、KKP-ID を入力してください。
        </AppText>

        <View style={styles.field}>
          <AppText variant="heading">KKP-ID</AppText>
          <TextInput
            value={kkpId}
            onChangeText={setKkpId}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="例: KKP-000001"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel="KKP-ID入力欄"
          />
        </View>

        <AppButton
          label={mutation.isPending ? '登録中...' : '登録する'}
          onPress={onSubmit}
          disabled={mutation.isPending}
        />

        <AppText variant="caption" style={{ marginTop: spacing.md }}>
          テスト用 ID: KKP-000001 (ユーザ) / ORG-000001 (イベント開催者)
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  field: { gap: spacing.sm, marginTop: spacing.md },
  input: {
    minHeight: 56,
    fontSize: typography.baseSize * 1.2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
});
