import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { ThemedText } from './ThemedText';

type Props = {
  label: string;
  lightColor?: string;
  darkColor?: string;
  onPress: () => void;
};

export default function Button({
  label,
  lightColor,
  darkColor,
  onPress,
}: Props) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background',
  );
  return (
    <View style={[{ backgroundColor }, styles.buttonContainer]}>
      <Pressable style={styles.button} onPress={onPress}>
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
    height: 68,
    justifyContent: 'center',
    marginHorizontal: 20,
    padding: 3,
    width: 320,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
  },
});
