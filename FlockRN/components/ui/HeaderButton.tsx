import { useColorScheme, ViewProps, StyleSheet } from 'react-native';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';

export type HeaderButtonProps = {
  onPress: () => void;
  label: string;
  style?: ViewProps;
};

export function HeaderButton({
  onPress,
  label,
  style,
  ...rest
}: HeaderButtonProps) {
  const colorScheme = useColorScheme();

  return (
    <Button
      size={'m'}
      onPress={onPress}
      label={label}
      textProps={StyleSheet.flatten([
        styles.headerTitleStyle,
        { color: colorScheme == 'dark' ? Colors.white : Colors.black },
      ])}
      backgroundColor={'transparent'}
      style={style}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: '400',
  },
});
