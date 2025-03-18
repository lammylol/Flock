import { Stack } from 'expo-router';

export default function prayers() {
  return (
    <Stack>
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
        }}
      />
    </Stack>
  );
}
