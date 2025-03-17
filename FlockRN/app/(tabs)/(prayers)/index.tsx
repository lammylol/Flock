import { StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { Prayer } from '@/types/firebase';
import useAuth from '@/hooks/useAuth';
import { useState } from 'react';
import { prayerService } from '@/services/prayer/prayerService';
import { Colors } from '@/constants/Colors';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

export default function TabTwoScreen() {
  const { user } = useAuth();
  const [userPrayers, setUserPrayers] = useState<Prayer[]>([]);
  const colorScheme = useColorScheme() || 'light';

  useFocusEffect(() => {
    const fetchPrayers = async () => {
      try {
        if (!user) return;
        const prayers = await prayerService.getUserPrayers(user.uid);
        setUserPrayers(prayers);
      } catch (error) {
        console.error('Error fetching prayers:', error);
      }
    };
    fetchPrayers();
  });
  return (
    <ThemedScrollView style={styles.header}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Prayers</ThemedText>
      </ThemedView>
      <ThemedView>
        <ThemedScrollView>
          {userPrayers.map((prayer: Prayer) => (
            <TouchableOpacity
              key={prayer.id}
              style={[
                styles.prayerContainer,
                { backgroundColor: Colors[colorScheme].background }, // Auto theme
              ]}
              onPress={() => {
                console.log(`Fetching prayer: ${prayer.id}`);
                router.push({
                  pathname: '/(prayers)/prayerView',
                  params: { id: prayer.id },
                });
              }}
            >
              <ThemedText>{prayer.title}</ThemedText>
              <ThemedText>{prayer.content}</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedScrollView>
      </ThemedView>
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 32,
  },
  prayerContainer: { flex: 1 },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
