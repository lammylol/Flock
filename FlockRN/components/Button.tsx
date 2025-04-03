import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';
import { ThemedText } from './ThemedText';

const sizeMap = {
  xs: { height: 25 },
  s: { height: 33 },
  m: { height: 40 },
  l: { height: 50 },
  xl: { height: 60 },
} as const;

type SizeType = keyof typeof sizeMap;

const getSize = (size: SizeType) => sizeMap[size]; // Using sizeMap as a value

interface Props extends ViewStyle {
  label: string;
  size?: SizeType;
  startIcon?: JSX.Element;
  endIcon?: JSX.Element;
  backgroundColor?: string;
  textProps?: TextStyle;
  onPress: () => void;
}

export default function Button({
  label,
  size = 's',
  startIcon,
  endIcon,
  backgroundColor,
  textProps,
  onPress,
  ...rest
}: Props) {
  const themedBackgroundColor = useThemeColor({}, 'tint');
  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: backgroundColor ?? themedBackgroundColor },
        { ...getSize(size), ...rest },
        style,
      ]}
      onPress={onPress}
    >
      {startIcon ?? null}
      <ThemedText style={[styles.buttonLabel, { ...textProps }]}>
        {label}
      </ThemedText>
      {endIcon ?? null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    padding: 3,
  },
  buttonLabel: {
    fontSize: 14,
  },
});
