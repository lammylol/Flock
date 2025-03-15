/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Prayer } from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { prayerService } from '@/services/prayer/prayerService';
import PrayerContent from '@/components/Prayer/PrayerView/PrayerContent';
import TagsSection from '@/components/Prayer/PrayerView/TagsSection';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import ContentUnavailable from '@/components/Errors/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';

const PrayerView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    fetchPrayer();
  }, [id]);

  const fetchPrayer = async () => {
    try {
      // throw new Error('Simulated error'); // Force an error
      const fetchedPrayer = await prayerService.getPrayer(id);
      setPrayer(fetchedPrayer);
    } catch (err) {
      console.log(err);
      setError('Prayer could not be fetched. Please try again.');
    }
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrayer();
  };

  return (
    <ThemedScrollView
      style={styles.scrollView}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {error ? (
        <ContentUnavailable
          errorTitle="Content Unavailable"
          errorMessage="Sorry, your prayer can't be loaded right now."
        />
      ) : (
        prayer && (
          <ThemedView style={[styles.innerContainer, { backgroundColor }]}>
            <PrayerContent title={prayer.title} content={prayer.content} />
            <TagsSection prayerId={prayer.id} tags={prayer.tags} />
          </ThemedView>
        )
      )}
    </ThemedScrollView>
  );
};

const styles = StyleSheet.create({
  innerContainer: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    flex: 0,
    padding: 16,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
});

export default PrayerView;
