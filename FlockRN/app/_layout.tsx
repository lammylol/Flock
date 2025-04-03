import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useRouter } from 'expo-router';
import useAuthContext from '@/hooks/useAuthContext';
import { AuthProvider } from '@/context/AuthContext';
import SpaceMonoFont from '../assets/fonts/SpaceMono-Regular.ttf';
import { useThemeColor } from '@/hooks/useThemeColor';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export function AppContent() {
  const { userIsAuthenticated, isAuthLoading } = useAuthContext();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const [loaded] = useFonts({
    SpaceMono: SpaceMonoFont,
  });

  useEffect(() => {
    if (loaded && !isAuthLoading) {
      SplashScreen.hideAsync();

      if (userIsAuthenticated) {
        // Redirect to tabs if authenticated
        router.replace('/(tabs)/(prayers)');
      } else {
        // Redirect to login if not authenticated
        router.replace('/auth/login');
      }
    }
  }, [loaded, userIsAuthenticated, isAuthLoading, router]);

  if (!loaded || isAuthLoading) {
    return null; // Wait for fonts to load and auth to resolve
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.view, { backgroundColor }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor },
        }}
      >
        <Stack.Screen name="about" options={{ title: 'About' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
  },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
