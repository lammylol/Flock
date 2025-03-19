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
import ContentUnavailable from '@/components/Errors/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';

const PrayerView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[] | null>(null);
  const user = useAuthContext().user;
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const colorScheme = useThemeColor({}, 'backgroundSecondary');

  useEffect(() => {
    fetchPrayer();
  }, [id]);

  const fetchPrayer = async () => {
    try {
      // throw new Error('Simulated error'); // Force an error
      const fetchedPrayer = await prayerService.getPrayer(id);
      setPrayer(fetchedPrayer);
      if (user && fetchedPrayer?.prayerPoints) {
        const fetchedPrayerPoints = await prayerService.getPrayerPoints(
          id,
          user,
        );
        setPrayerPoints(fetchedPrayerPoints);
      }
    } catch (err) {
      console.error(err);
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
          <>
            <ThemedView
              style={{
                ...styles.innerContainer,
                backgroundColor: colorScheme,
              }}
            >
              <PrayerContent title={prayer.title} content={prayer.content} />
              <TagsSection prayerId={prayer.id} tags={prayer.tags} />
            </ThemedView>

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
          </>
        )
      )}
    </ThemedScrollView>
  );
};

const styles = StyleSheet.create({
  innerContainer: {
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
    paddingHorizontal: 20,
  },
});

export default PrayerView;
