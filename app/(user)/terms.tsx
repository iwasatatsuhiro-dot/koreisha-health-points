import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { TERMS_TEXT, TERMS_VERSION } from '@/src/constants/terms';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';

export default function TermsScreen() {
  const router = useRouter();
  const termsAcceptedAt = useAuthStore((s) => s.termsAcceptedAt);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">利用規約</AppText>
        <AppText variant="caption" style={styles.muted}>
          規約制定日: {TERMS_VERSION}
        </AppText>

        <Card>
          <AppText variant="body">{TERMS_TEXT}</AppText>
        </Card>

        {termsAcceptedAt && (
          <View style={styles.acceptedBox}>
            <AppText variant="caption" style={styles.accepted}>
              ✓ 本規約に同意済み（{new Date(termsAcceptedAt).toLocaleString('ja-JP')}）
            </AppText>
          </View>
        )}

        <AppButton label="戻る" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  muted: { color: colors.textMuted },
  acceptedBox: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  accepted: { color: colors.success, fontWeight: '700' },
});
