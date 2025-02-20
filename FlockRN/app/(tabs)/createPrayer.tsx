import { useEffect } from 'react';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';

export default function CreatePrayerScreen() {
  useEffect(() => {
    // Automatically redirect to prayer write screen when this tab is selected
    router.push('/prayer/prayerWrite');
  }, []);

  // Return an empty view while redirecting
  return <ThemedView />;
}