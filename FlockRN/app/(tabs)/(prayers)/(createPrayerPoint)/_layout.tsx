import { Stack } from 'expo-router';

export default function CreatePrayerPointsFlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
      }}
      initialRouteName="createPrayerPoint"
    ></Stack>
  );
}
