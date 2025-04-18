import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import 'react-native-reanimated';
import useAuthContext from '@/hooks/useAuthContext';
import { AuthProvider } from '@/context/AuthContext';
import SpaceMonoFont from '../assets/fonts/SpaceMono-Regular.ttf';
import { useThemeColor } from '@/hooks/useThemeColor';
import { UserProvider } from '@/context/UserContext';
import useUserContext from '@/hooks/useUserContext';
import { useSessionTracking } from '@/hooks/analytics/useSessionTracking';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export function AppContent() {
  const { userIsAuthenticated, isAuthLoading } = useAuthContext();
  const { userIntroFlowFlags } = useUserContext();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const [loaded] = useFonts({
    SpaceMono: SpaceMonoFont,
  });
  // analytics
  useSessionTracking();

  const directUserToFirstScreen = useCallback(() => {
    if (userIsAuthenticated) {
      // Redirect to tabs if authenticated
      router.replace('/(tabs)/(prayers)');
    } else if (!userIntroFlowFlags.hasIntroDisclosures) {
      // Redirect to intro flow if this is their first time
      router.replace('/auth/introFlow');
    } else {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    }
  }, [router, userIntroFlowFlags.hasIntroDisclosures, userIsAuthenticated]);

  useEffect(() => {
    if (loaded && !isAuthLoading) {
      SplashScreen.hideAsync();
      directUserToFirstScreen();
    }
  }, [
    loaded,
    userIsAuthenticated,
    isAuthLoading,
    router,
    directUserToFirstScreen,
  ]);

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
      <UserProvider>
        <AppContent />
      </UserProvider>
    </AuthProvider>
  );
}
