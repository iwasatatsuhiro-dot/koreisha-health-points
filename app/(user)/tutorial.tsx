import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { TUTORIAL_STEPS } from '@/src/constants/tutorial';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing } from '@/src/theme';

export default function Tutorial() {
  const router = useRouter();
  const params = useLocalSearchParams<{ replay?: string }>();
  const isReplay = params.replay === '1';
  const completeTutorial = useAuthStore((s) => s.completeTutorial);
  const [step, setStep] = useState(0);

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  function finish() {
    if (!isReplay) completeTutorial();
    if (isReplay) router.back();
    else router.replace('/(user)/home');
  }

  function skip() {
    if (!isReplay) completeTutorial();
    if (isReplay) router.back();
    else router.replace('/(user)/home');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <AppText variant="caption" style={styles.muted}>
            {step + 1} / {TUTORIAL_STEPS.length}
          </AppText>
          <Pressable onPress={skip} hitSlop={12}>
            <AppText variant="caption" style={styles.skip}>
              {isReplay ? '閉じる' : 'スキップ'}
            </AppText>
          </Pressable>
        </View>

        <Card style={styles.slideCard}>
          <AppText variant="title" style={styles.emoji}>{current.emoji}</AppText>
          <AppText variant="title" style={styles.title}>{current.title}</AppText>
          <AppText variant="body" style={styles.body}>{current.body}</AppText>
        </Card>

        <View style={styles.dots}>
          {TUTORIAL_STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.navRow}>
          {step > 0 ? (
            <AppButton
              label="戻る"
              variant="secondary"
              onPress={() => setStep((s) => Math.max(0, s - 1))}
              style={styles.navBtn}
            />
          ) : (
            <View style={styles.navBtn} />
          )}
          <AppButton
            label={isLast ? (isReplay ? '閉じる' : 'はじめる') : '次へ'}
            onPress={() => (isLast ? finish() : setStep((s) => s + 1))}
            style={styles.navBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { color: colors.textMuted },
  skip: { color: colors.primary, fontWeight: '700' },
  slideCard: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  emoji: { fontSize: 72, textAlign: 'center' },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', lineHeight: 28 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  navRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  navBtn: { flex: 1 },
});
