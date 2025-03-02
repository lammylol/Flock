import { RecordingProvider } from '@/context/RecordingContext';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function CreatePrayerFlowLayout() {
    return (
        <SafeAreaProvider>
            <RecordingProvider>
                <Stack screenOptions={{ headerShown: true }}>
                    <Stack.Screen name="index" 
                        options={{ title: "Create Prayer" }} 
                    />
                    <Stack.Screen name="prayerMetadata" 
                        options={{ title: "Edit Prayer" }}
                    />
                </Stack>
            </RecordingProvider>
        </SafeAreaProvider>
    );
}