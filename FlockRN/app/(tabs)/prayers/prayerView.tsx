/* This file sets the screen that a user sees when clicking into a prayer.*/
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Prayer } from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { prayerService } from '@/services/prayer/prayerService';
import PrayerContent from '@/components/Prayer/PrayerView/PrayerContent';
import TagsSection from '@/components/Prayer/PrayerView/TagsSection';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

const PrayerView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchPrayer = async () => {
      const fetchedPrayer = await prayerService.getPrayer(id);
      setPrayer(fetchedPrayer);
    };

    fetchPrayer();
  }, [id]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [TagsSection]); // Scroll to bottom whenever messages change

  return (
    <ScrollView ref={scrollViewRef} style={styles.scrollView}>
      <ThemedView style={styles.mainBackground}>
        {prayer && (
          <ThemedView style={styles.container}>
            <PrayerContent title={prayer.title} content={prayer.content} />
            <TagsSection prayerId={prayer.id} tags={prayer.tags} />
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    flex: 0,
    padding: 16,
  },
  mainBackground: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
});

export default PrayerView;
