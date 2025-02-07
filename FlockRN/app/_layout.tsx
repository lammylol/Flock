import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import useAuthContext from '@/hooks/useAuthContext';
import { AuthProvider } from '@/context/AuthContext';
import { logEvent } from 'expo-firebase-analytics';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export function AppContent() {
  const { user, isAuthLoading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded && !isAuthLoading) {
      SplashScreen.hideAsync();

      if (!user) {
        router.replace('/auth/login');
      }
    }
  }, [loaded, user, isAuthLoading, router]);

  // Log screen views to Firebase Analytics
  useEffect(() => {
    if (pathname) {
      logEvent('screen_view', {
        screen_name: pathname,
        screen_class: 'ExpoRouterScreen',
      });
    }
  }, [pathname]); // Runs every time the route changes

  if (!loaded || isAuthLoading) {
    return null; // Wait for fonts to load and auth to resolve
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {user ? (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="about" options={{ title: 'About' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
