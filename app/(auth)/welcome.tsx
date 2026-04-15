import { View, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { useAuthStore } from '@/src/stores/authStore';
import { TERMS_TEXT } from '@/src/constants/terms';
import { colors, spacing } from '@/src/theme';

export default function Welcome() {
  const acceptTerms = useAuthStore((s) => s.acceptTerms);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">ようこそ</AppText>
        <AppText variant="body" style={{ marginTop: spacing.sm }}>
          札幌市 高齢者向け健康ポイントアプリ
        </AppText>

        <View style={styles.termsBox}>
          <AppText variant="heading" style={{ marginBottom: spacing.sm }}>
            利用規約
          </AppText>
          <AppText variant="body">{TERMS_TEXT}</AppText>
        </View>

        <AppButton
          label="同意して次へ"
          onPress={() => {
            acceptTerms();
            router.replace('/(auth)/register');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  termsBox: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
});
