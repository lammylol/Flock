import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ReactNode } from 'react';

export function ThemedStack({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme() || 'light';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors[colorScheme].background },
        headerTintColor: Colors[colorScheme].textPrimary,
      }}
    >
      {children}
    </Stack>
  );
}
