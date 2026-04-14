import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { useSubmitVital, useVitals } from '@/src/hooks/useVitals';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing, typography } from '@/src/theme';
import { useAccessibilityStore } from '@/src/stores/accessibilityStore';
import type { VitalInput, VitalReading, VitalType } from '@/src/types';

const TYPE_LABELS: Record<VitalType, string> = {
  blood_pressure: '血圧',
  heart_rate: '心拍',
  temperature: '体温',
  weight: '体重',
};

const TYPE_ORDER: VitalType[] = ['blood_pressure', 'heart_rate', 'temperature', 'weight'];

function formatReading(v: VitalReading): string {
  switch (v.type) {
    case 'blood_pressure':
      return `${v.systolic} / ${v.diastolic} mmHg`;
    case 'heart_rate':
      return `${v.bpm} bpm`;
    case 'temperature':
      return `${v.celsius?.toFixed(1)} ℃`;
    case 'weight':
      return `${v.weightKg?.toFixed(1)} kg`;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Vitals() {
  const { kkpId } = useAuthStore();
  const [type, setType] = useState<VitalType>('blood_pressure');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bpm, setBpm] = useState('');
  const [celsius, setCelsius] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const submit = useSubmitVital(kkpId);
  const list = useVitals(kkpId);

  function resetInputs() {
    setSystolic('');
    setDiastolic('');
    setBpm('');
    setCelsius('');
    setWeightKg('');
  }

  function buildInput(): VitalInput | string {
    switch (type) {
      case 'blood_pressure': {
        const s = Number(systolic);
        const d = Number(diastolic);
        if (!Number.isFinite(s) || !Number.isFinite(d)) return '血圧（上・下）を数値で入力してください。';
        if (s < 50 || s > 260 || d < 30 || d > 200) return '血圧の値が正しくありません。';
        if (s <= d) return '血圧の上は下より大きい値にしてください。';
        return { type, systolic: s, diastolic: d };
      }
      case 'heart_rate': {
        const n = Number(bpm);
        if (!Number.isFinite(n)) return '心拍数を数値で入力してください。';
        if (n < 20 || n > 250) return '心拍数の値が正しくありません。';
        return { type, bpm: n };
      }
      case 'temperature': {
        const n = Number(celsius);
        if (!Number.isFinite(n)) return '体温を数値で入力してください。';
        if (n < 30 || n > 45) return '体温の値が正しくありません。';
        return { type, celsius: n };
      }
      case 'weight': {
        const n = Number(weightKg);
        if (!Number.isFinite(n)) return '体重を数値で入力してください。';
        if (n < 10 || n > 300) return '体重の値が正しくありません。';
        return { type, weightKg: n };
      }
    }
  }

  function onSubmit() {
    setError(null);
    setOkMessage(null);
    const input = buildInput();
    if (typeof input === 'string') {
      setError(input);
      return;
    }
    submit.mutate(input, {
      onSuccess: () => {
        resetInputs();
        setOkMessage('記録しました。');
      },
      onError: () => setError('保存に失敗しました。時間をおいてお試しください。'),
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <AppText variant="title">バイタルを記録</AppText>

          <View style={styles.segmentRow}>
            {TYPE_ORDER.map((t) => (
              <TypePill
                key={t}
                label={TYPE_LABELS[t]}
                selected={type === t}
                onPress={() => {
                  setType(t);
                  setError(null);
                  setOkMessage(null);
                }}
              />
            ))}
          </View>

          <Card>
            <AppText variant="heading">{TYPE_LABELS[type]}</AppText>
            {type === 'blood_pressure' && (
              <>
                <LabeledInput
                  label="上 (収縮期)"
                  value={systolic}
                  onChangeText={setSystolic}
                  suffix="mmHg"
                  placeholder="120"
                />
                <LabeledInput
                  label="下 (拡張期)"
                  value={diastolic}
                  onChangeText={setDiastolic}
                  suffix="mmHg"
                  placeholder="80"
                />
              </>
            )}
            {type === 'heart_rate' && (
              <LabeledInput
                label="心拍数"
                value={bpm}
                onChangeText={setBpm}
                suffix="bpm"
                placeholder="72"
              />
            )}
            {type === 'temperature' && (
              <LabeledInput
                label="体温"
                value={celsius}
                onChangeText={setCelsius}
                suffix="℃"
                placeholder="36.5"
                decimal
              />
            )}
            {type === 'weight' && (
              <LabeledInput
                label="体重"
                value={weightKg}
                onChangeText={setWeightKg}
                suffix="kg"
                placeholder="60.0"
                decimal
              />
            )}

            {error && (
              <AppText variant="body" style={{ color: colors.danger }}>
                {error}
              </AppText>
            )}
            {okMessage && (
              <AppText variant="body" style={{ color: colors.success }}>
                {okMessage}
              </AppText>
            )}

            <AppButton
              label={submit.isPending ? '保存中...' : '保存する'}
              onPress={onSubmit}
              disabled={submit.isPending}
            />
          </Card>

          <AppText variant="heading">これまでの記録</AppText>
          {list.isLoading && <AppText variant="body">読み込み中...</AppText>}
          {list.data && list.data.length === 0 && (
            <AppText variant="body">まだ記録はありません。</AppText>
          )}
          {list.data?.map((v) => (
            <Card key={v.id}>
              <View style={styles.historyRow}>
                <AppText variant="body" style={{ flex: 1 }}>
                  {TYPE_LABELS[v.type]}
                </AppText>
                <AppText variant="heading">{formatReading(v)}</AppText>
              </View>
              <AppText variant="caption">{formatDate(v.recordedAt)}</AppText>
            </Card>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TypePill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.pill, selected && styles.pillSelected]}
    >
      <AppText
        variant="body"
        style={{
          color: selected ? '#FFFFFF' : colors.primary,
          fontWeight: typography.weights.bold,
          textAlign: 'center',
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  suffix,
  placeholder,
  decimal,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  suffix: string;
  placeholder?: string;
  decimal?: boolean;
}) {
  const scale = useAccessibilityStore((s) => s.fontScale);
  const inputFontSize = typography.baseSize * scale;
  return (
    <View style={styles.fieldGroup}>
      <AppText variant="body">{label}</AppText>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          style={[styles.input, { fontSize: inputFontSize }]}
          placeholderTextColor={colors.textMuted}
        />
        <AppText variant="body" style={{ marginLeft: spacing.sm }}>
          {suffix}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 64,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
