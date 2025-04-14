import { Stack } from 'expo-router';
import { ThemedStack } from '@/components/ThemedStack';
import { PrayerCollectionProvider } from '@/context/PrayerCollectionContext';

export default function prayers() {
  return (
    <PrayerCollectionProvider>
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
          name="prayerPointView"
          options={{
            title: 'Prayer Point',
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
        <Stack.Screen
          name="(createPrayerPoint)"
          options={{
            title: 'Add Prayer Point',
            headerBackButtonDisplayMode: 'default',
            headerBackTitle: 'Back',
            headerShadowVisible: false,
            headerShown: false,
            animation: 'slide_from_bottom',
            animationDuration: 30,
          }}
        />
      </ThemedStack>
    </PrayerCollectionProvider>
  );
}
