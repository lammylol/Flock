/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Prayer, PrayerPoint } from '@/types/firebase';
import { prayerService } from '@/services/prayer/prayerService';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import useAuthContext from '@/hooks/useAuthContext';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';
import PrayerPointSection from '@/components/Prayer/PrayerViews/PrayerPointSection';
import { HeaderButton } from '@/components/ui/HeaderButton';

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
        privacy: prayer.privacy,
        mode: 'edit',
      },
    });
  };

  const formattedDate = (() => {
    if (!prayer?.createdAt) return 'Unknown Date'; // Handle missing date

    const date =
      prayer.createdAt instanceof Date
        ? prayer.createdAt
        : typeof prayer.createdAt === 'object' && 'seconds' in prayer.createdAt
          ? new Date(prayer.createdAt.seconds * 1000)
          : new Date(prayer.createdAt);

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  })();

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
            <Stack.Screen
              options={{
                headerRight: () =>
                  isOwner && <HeaderButton onPress={handleEdit} label="Edit" />,
                // headerLeft: () => (
                //   <HeaderButton onPress={router.back} label="Back" />
                // ),
                // title: 'Prayer',
              }}
            />
            <PrayerContent
              title={formattedDate}
              content={prayer.content}
              backgroundColor={colorScheme}
            />
            {prayerPoints && <PrayerPointSection prayerPoints={prayerPoints} />}
          </>
        )
      )}
    </ThemedScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
});

export default PrayerView;
