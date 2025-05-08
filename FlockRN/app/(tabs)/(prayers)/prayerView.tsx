/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { prayerService } from '@/services/prayer/prayerService';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import useAuthContext from '@/hooks/useAuthContext';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';
import PrayerPointSection from '@/components/Prayer/PrayerViews/PrayerPointSection';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { PrayerPoint } from '@/types/firebase';
import { forEach } from 'lodash';
import { EntityType } from '@/types/PrayerSubtypes';
import { EditMode } from '@/types/ComponentProps';
import { prayerPointService } from '@/services/prayer/prayerPointService';

const PrayerView = () => {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { userPrayers, updateCollection } = usePrayerCollection();

  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);
  // this sits separate since prayer points in prayer are loaded in prayer view only.

  const prayer = userPrayers.find((prayer) => prayer.id === id);

  const user = useAuthContext().user;
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const isOwner = prayer && user && prayer.authorId === user.uid;
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchPrayer = useCallback(async () => {
    try {
      const fetchedPrayer = await prayerService.getPrayer(id);
      if (fetchedPrayer) {
        updateCollection(fetchedPrayer, 'prayer');
      }
    } catch (err) {
      console.error(err);
      setError('Prayer could not be fetched. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [id, updateCollection]);

  const fetchPrayerPoints = useCallback(async () => {
    try {
      if (user && (prayer?.prayerPoints ?? []).length > 0) {
        const fetchedPrayerPoints = await prayerPointService.getPrayerPoints(
          id,
          user,
        );
        setPrayerPoints(fetchedPrayerPoints ?? []);
        forEach(fetchedPrayerPoints, (prayerPoint) =>
          updateCollection(prayerPoint, 'prayerPoint'),
        );
      }
    } catch (err) {
      console.error(err);
      setError('Prayer points could not be fetched. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [id, prayer?.prayerPoints, setPrayerPoints, updateCollection, user]);

  useEffect(() => {
    fetchPrayerPoints(); // Fetch only prayer points. Prayer is fetched in the prayer view.
  }, [fetchPrayerPoints, id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrayer();
    fetchPrayerPoints();
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
        editMode: EditMode.EDIT,
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
              editMode={EditMode.VIEW}
              prayer={prayer}
              prayerOrPrayerPoint={EntityType.Prayer}
              backgroundColor={colorScheme}
            />
            {prayerPoints && (
              <PrayerPointSection
                prayerPoints={prayerPoints}
                isSectionEditable={false}
              />
            )}
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
