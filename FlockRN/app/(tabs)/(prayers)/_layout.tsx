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
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="(createPrayer)"
        options={{
          title: 'Add Prayer',
          headerBackButtonDisplayMode: 'default',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerShown: false,
          animation: 'slide_from_bottom',
          animationDuration: 30,
        }}
      />
    </ThemedStack>
  );
}
