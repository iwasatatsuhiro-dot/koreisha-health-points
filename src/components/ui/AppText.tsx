import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography } from '@/src/theme';
import { useAccessibilityStore } from '@/src/stores/accessibilityStore';

type Variant = 'title' | 'heading' | 'body' | 'caption';

const variantStyles: Record<Variant, TextStyle> = {
  title: { fontSize: 28, fontWeight: typography.weights.bold, color: colors.text },
  heading: { fontSize: 22, fontWeight: typography.weights.bold, color: colors.text },
  body: { fontSize: typography.baseSize, color: colors.text },
  caption: { fontSize: 14, color: colors.textMuted },
};

export function AppText({
  variant = 'body',
  style,
  ...rest
}: TextProps & { variant?: Variant }) {
  const scale = useAccessibilityStore((s) => s.fontScale);
  const base = variantStyles[variant];
  const scaled: TextStyle = {
    ...base,
    fontSize: (base.fontSize ?? typography.baseSize) * scale,
    lineHeight: (base.fontSize ?? typography.baseSize) * scale * typography.lineHeightRatio,
  };
  return <Text {...rest} style={[scaled, style]} />;
}
