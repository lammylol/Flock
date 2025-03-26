import { StyleSheet } from 'react-native';
import Button from '@/components/Button';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export function FloatingAddPrayerButton() {
    const colorScheme = useColorScheme();

    const handleFloatingButtonPress = () => {
        router.push('/(tabs)/(prayers)/(createPrayer)');
    }

    return (
        <Button
            size={'l'}
            onPress={handleFloatingButtonPress}
            label={"+ Add Prayer"}
            textProps={StyleSheet.flatten([
                styles.floatingButtonText,
                { color: Colors.white },
            ])}
            backgroundColor={colorScheme == 'dark' ? Colors.secondary : Colors.black}
            style={styles.floatingButton}
        />
    )
};

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,  // Horizontal padding inside the button
        elevation: 5, // Adds shadow for Android
        shadowColor: Colors.black, // Adds shadow for iOS
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        zIndex: 9999,
        right: 30,
        bottom: 25,
    },
    floatingButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center'
    }
});