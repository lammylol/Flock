import { Stack } from 'expo-router';
import { ThemedStack } from '@/components/ThemedStack';

export default function prayers() {
  return (
    <ThemedStack>
      <Stack.Screen
        name="index"
        options={{
          title: 'MyPrayers',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="prayerView"
        options={{
          title: 'Prayer',
          headerBackButtonDisplayMode: 'default',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
        }}
      />
    </ThemedStack>
  );
}
