import { View, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';

const TERMS = `本アプリは、札幌市高齢者向け健康ポイント事業の一環として提供されます。

・アプリでは個人情報を扱いません。札幌市が発行する KKP-ID により活動を記録します。
・歩数等のヘルスケア情報は、端末内のセンサーから自動的に取得され、ポイント付与のために事務局システムへ連携されます。
・イベント参加時のQRコード読み取りに際し、不正防止のため位置情報を利用することがあります。
・アプリのご利用には利用規約への同意が必要です。`;

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
          <AppText variant="body">{TERMS}</AppText>
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
