import { KeyboardAvoidingView, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedKeyboardAvoidingViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  behavior?: 'height' | 'position' | 'padding';
  keyboardVerticalOffset?: number;
};

export function ThemedKeyboardAvoidingView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedKeyboardAvoidingViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background',
  );

  return (
    <KeyboardAvoidingView
      style={[{ backgroundColor }, style]}
      {...otherProps}
    />
  );
}
