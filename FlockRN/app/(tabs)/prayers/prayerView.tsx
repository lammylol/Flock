/* This file sets the screen that a user sees when clicking into a prayer.*/
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Prayer } from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { prayerService } from '@/services/prayer/prayerService';
import PrayerContent from '@/components/Prayer/PrayerView/PrayerContent';
import TagsSection from '@/components/Prayer/PrayerView/TagsSection';
import ToggleSwitch from '@/components/toggleSwitch';
import { ThemedView } from '@/components/ThemedView';

const PrayerView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const fetchPrayer = async () => {
      const fetchedPrayer = await prayerService.getPrayer(id);
      setPrayer(fetchedPrayer);
    };

    fetchPrayer();
  }, [id]);

  // const prayer = usePrayerStore((state) => state.prayers[id]); // Fetch from global store

  return (
    <ThemedView style={styles.mainBackground}>
      {prayer && (
        <ThemedView style={styles.container}>
          <PrayerContent title={prayer.title} content={prayer.content} />
          <TagsSection
            tags={prayer.tags}
            onTagPress={(tag) => console.log('Tag pressed:', tag)}
          />
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  mainBackground: {
    flex: 1,
    paddingHorizontal: 15,
  },
  container: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    flex: 0,
    padding: 16,
  },
});

export default PrayerView;
