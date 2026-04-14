import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { useAccessibilityStore } from '@/src/stores/accessibilityStore';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';

export default function Settings() {
  const { fontScale, cycleFontScale } = useAccessibilityStore();
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">設定</AppText>

        <View style={{ gap: spacing.sm }}>
          <AppText variant="heading">文字サイズ</AppText>
          <AppText variant="body">現在: {Math.round(fontScale * 100)}%</AppText>
          <AppButton label="文字サイズを変更" variant="secondary" onPress={cycleFontScale} />
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <AppButton label="ログアウト" variant="secondary" onPress={signOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
});
