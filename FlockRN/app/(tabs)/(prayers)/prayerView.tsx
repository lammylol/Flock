/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Prayer, PrayerPoint } from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { prayerService } from '@/services/prayer/prayerService';
import PrayerContent from '@/components/Prayer/PrayerView/PrayerContent';
import TagsSection from '@/components/Prayer/PrayerView/TagsSection';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import PrayerPointCard from '@/components/Prayer/PrayerPoints/PrayerPointCard';
import useAuthContext from '@/hooks/useAuthContext';
import { ThemedText } from '@/components/ThemedText';

const PrayerView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[] | null>(null);
  const user = useAuthContext().user;

  useEffect(() => {
    const fetchPrayer = async () => {
      const fetchedPrayer = await prayerService.getPrayer(id);
      console.log('Fetched Prayer:', fetchedPrayer);
      setPrayer(fetchedPrayer);
      console.log('Current User:', user?.uid === fetchedPrayer?.authorId);
      if (user && fetchedPrayer?.prayerPoints) {
        const fetchedPrayerPoints = await prayerService.getPrayerPoints(
          id,
          user,
        );
        setPrayerPoints(fetchedPrayerPoints);
      }
    };

    fetchPrayer();
  }, [id]);

  // Logs the updated state properly
  useEffect(() => {
    console.log(prayerPoints);
  }, [prayerPoints]);

  return (
    <ThemedScrollView style={styles.scrollView}>
      <ThemedView style={styles.mainBackground}>
        {prayer && (
          <ThemedView style={styles.container}>
            <PrayerContent title={prayer.title} content={prayer.content} />
            <TagsSection prayerId={prayer.id} tags={prayer.tags} />
          </ThemedView>
        )}
        {prayerPoints && (
          <ThemedView
            style={
              (styles.prayerPointsContainer,
                { borderColor: Colors.primary, borderWidth: 1, borderRadius: 20 })
            }
          >
            <ThemedText
              lightColor={Colors.light.textSecondary}
              darkColor={Colors.dark.textPrimary}
              style={styles.prayerPointsText}
            >
              Prayer Points
            </ThemedText>
            <PrayerPointCard
              title={prayerPoints[0].title}
              content={prayerPoints[0].content}
            />
          </ThemedView>
        )}
      </ThemedView>
    </ThemedScrollView>
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
    gap: 10,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
  prayerPointsContainer: {
    borderRadius: 20,
    flex: 0,
    padding: 16,
  },
  prayerPointsText: {
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 30,
    padding: 16,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
});

export default PrayerView;
