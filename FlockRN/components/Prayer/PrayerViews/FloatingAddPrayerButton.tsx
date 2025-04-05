import { StyleSheet } from 'react-native';
import Button from '@/components/Button';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export interface FloatingPrayerButtonProps {
  label: string;
  route: string;
  bottom: number;
  right: number;
}

export function FloatingAddPrayerButton({
  label,
  route,
  bottom,
  right,
}: FloatingPrayerButtonProps): JSX.Element {
  const colorScheme = useColorScheme();

  const handleFloatingButtonPress = () => {
    router.push(route);
  };

  return (
    <Button
      size={'l'}
      onPress={handleFloatingButtonPress}
      label={label}
      textProps={StyleSheet.flatten([
        styles.floatingButtonText,
        { color: Colors.white },
      ])}
      backgroundColor={colorScheme == 'dark' ? Colors.secondary : Colors.black}
      style={StyleSheet.flatten([
        styles.floatingButton,
        { bottom: bottom, right: right },
      ])}
    />
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    alignItems: 'center',
    borderRadius: 25,
    elevation: 5, // Adds shadow for Android
    justifyContent: 'center',
    paddingHorizontal: 20, // Horizontal padding inside the button
    position: 'absolute',
    shadowColor: Colors.black, // Adds shadow for iOS
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 9999,
  },
  floatingButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
