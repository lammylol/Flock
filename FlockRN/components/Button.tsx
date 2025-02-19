import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from './ThemedText';

const sizeMap = {
  xs: { height: 20, width: 100 },
  s: { height: 30, width: 200 },
  m: { height: 40, width: 300 },
  l: { height: 50, width: 400 },
  xl: { height: 60, width: 500 },
} as const;

type SizeType = keyof typeof sizeMap;

const getSize = (size: SizeType) => sizeMap[size]; // Using sizeMap as a value

type Props = {
  label: string;
  size?: SizeType;
  onPress: () => void;
};

export default function Button({ label, size = 's', onPress }: Props) {
  const backgroundColor = useThemeColor({}, 'tint');
  return (
    <View style={[styles.buttonContainer, { ...getSize(size) }]}>
      <Pressable style={[{ backgroundColor }, styles.button]} onPress={onPress}>
        <ThemedText style={styles.buttonLabel}>{label}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  buttonContainer: {
    alignItems: 'center',
    height: 45,
    justifyContent: 'center',
    marginHorizontal: 20,
    padding: 3,
    width: 150,
  },
  buttonLabel: {
    fontSize: 16,
  },
});
