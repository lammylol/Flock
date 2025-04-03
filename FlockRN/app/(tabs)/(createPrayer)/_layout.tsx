import { RecordingProvider } from '@/context/RecordingContext';
import { Stack } from 'expo-router';

export default function CreatePrayerFlowLayout() {
  return (
    <RecordingProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Create Prayer' }} />
        <Stack.Screen
          name="voiceRecording"
          options={{
            title: 'Record Prayer',
            headerBackButtonDisplayMode: 'default',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="prayerMetadata"
          options={{
            title: 'Edit Prayer',
            headerBackButtonDisplayMode: 'default',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </RecordingProvider>
  );
}
