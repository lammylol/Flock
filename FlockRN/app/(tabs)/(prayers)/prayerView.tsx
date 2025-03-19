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
      setPrayer(fetchedPrayer);
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
            style={[
              styles.prayerPointsContainer,
              { borderColor: Colors.secondary },
            ]}
          >
            <ThemedText
              lightColor={Colors.light.textSecondary}
              darkColor={Colors.dark.textPrimary}
              style={styles.prayerPointsText}
            >
              Prayer Points
            </ThemedText>
            {prayerPoints.map((prayerPoint: PrayerPoint) => (
              <PrayerPointCard
                key={prayerPoint.id}
                title={prayerPoint.title}
                content={prayerPoint.content}
              />
            ))}
          </ThemedView>
        )}
      </ThemedView>
    </ThemedScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondary,
    borderRadius: 15,
    flex: 0,
    gap: 15,
    padding: 25,
  },
  mainBackground: {
    flex: 1,
    gap: 20,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
  prayerPointsContainer: {
    borderRadius: 15,
    borderWidth: 1,
    flex: 0,
    gap: 15,
    padding: 25,
  },
  prayerPointsText: {
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
});

export default PrayerView;
