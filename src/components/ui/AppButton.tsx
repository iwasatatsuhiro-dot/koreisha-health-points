import { Pressable, StyleSheet, type PressableProps, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '@/src/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  disabled?: boolean;
};

export function AppButton({ label, variant = 'primary', disabled, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      {...rest}
    >
      <View>
        <AppText
          variant="heading"
          style={{
            color: variant === 'primary' ? '#FFFFFF' : colors.primary,
            textAlign: 'center',
          }}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 64,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  pressed: { opacity: 0.85 },
});
