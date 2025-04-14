import { Stack } from 'expo-router';

export default function CreatePrayerPointsFlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
      }}
      initialRouteName="createPrayerPoint"
    ></Stack>
  );
}
