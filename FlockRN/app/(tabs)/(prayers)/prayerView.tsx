/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Prayer, PrayerPoint } from '@/types/firebase';
import { prayerService } from '@/services/prayer/prayerService';
import PrayerContent from '@/components/Prayer/PrayerView/PrayerContent';
import TagsSection from '@/components/Prayer/PrayerView/TagsSection';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import useAuthContext from '@/hooks/useAuthContext';
import { ThemedText } from '@/components/ThemedText';
import ContentUnavailable from '@/components/Errors/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';
import PrayerPointSection from '@/components/Prayer/PrayerPoints/PrayerPointSection';

const PrayerView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[] | null>(null);
  const user = useAuthContext().user;
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const isOwner = prayer && user && prayer.authorId === user.uid;
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchPrayer = useCallback(async () => {
    try {
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
    } finally {
      setRefreshing(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchPrayer();
  }, [fetchPrayer, id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrayer();
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []); // Scroll to bottom whenever messages change

  const handleEdit = () => {
    if (!prayer) return;

    // Navigate to metadata screen with all the prayer data
    router.push({
      pathname: '/(tabs)/(prayers)/(createPrayer)/prayerMetadata',
      params: {
        id: prayer.id,
        content: prayer.content,
        title: prayer.title,
        privacy: prayer.privacy,
        tags: JSON.stringify(prayer.tags),
        mode: 'edit',
      },
    });
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
              {isOwner && (
                <TouchableOpacity
                  onPress={handleEdit}
                  style={styles.editButton}
                >
                  <ThemedText style={styles.editButtonText}>Edit</ThemedText>
                </TouchableOpacity>
              )}
              <PrayerContent title={prayer.title} content={prayer.content} />
              <TagsSection prayerId={prayer.id} tags={prayer.tags} />
            </ThemedView>

            {prayerPoints && <PrayerPointSection prayerPoints={prayerPoints} />}
          </>
        )
      )}
    </ThemedScrollView>
  );
};

const styles = StyleSheet.create({
  editButton: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  innerContainer: {
    borderRadius: 15,
    flex: 0,
    gap: 15,
    padding: 25,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
});

export default PrayerView;
