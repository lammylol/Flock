import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScrollView from '@/components/ScrollView';
import { Prayer } from '@/types/firebase';
import useAuth from '@/hooks/useAuth';
import { useState } from 'react';
import { prayerService } from '@/services/prayer/prayerServices';
import { Colors } from '@/constants/Colors';
import { useFocusEffect } from '@react-navigation/native';

export default function TabTwoScreen() {
  const { user } = useAuth();
  const [userPrayers, setUserPrayers] = useState<Prayer[]>([]);

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
    <ScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Prayers</ThemedText>
      </ThemedView>
      <ThemedView>
        <ScrollView>
          {userPrayers.map((prayer: Prayer) => (
            <ThemedView
              key={prayer.id}
              style={styles.prayerContainer}
              lightColor={Colors.light.tabIconDefault}
              darkColor={Colors.dark.tabIconDefault}
            >
              <ThemedText>{prayer.title}</ThemedText>
              <ThemedText>{prayer.content}</ThemedText>
            </ThemedView>
          ))}
        </ScrollView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  prayerContainer: { flex: 1 },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
