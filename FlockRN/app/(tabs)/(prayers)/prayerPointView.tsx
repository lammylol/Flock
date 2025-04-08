/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { prayerService } from '@/services/prayer/prayerService';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import useAuthContext from '@/hooks/useAuthContext';
import { ThemedText } from '@/components/ThemedText';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';

const PrayerPointView = () => {
  const { id: prayerPointId } = useLocalSearchParams() as {
    id: string;
  };

  const { userPrayerPoints, updateCollection } = usePrayerCollection();

  // Use the collection to get the latest data
  const prayerPoint =
    userPrayerPoints.find((p) => p.id === prayerPointId) || null;

  const user = useAuthContext().user;
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'textPrimary');
  const isOwner = prayerPoint && user && prayerPoint.authorId === user.uid;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    console.log('PrayerPointId:', prayerPointId);
  }, [prayerPointId]);

  const fetchPrayerPoint = useCallback(async () => {
    try {
      const fetchedPrayer = await prayerService.getPrayerPoint(prayerPointId);
      // console.log('Fetched prayer:', fetchedPrayer);
      if (fetchedPrayer) {
        updateCollection(fetchedPrayer, 'prayerPoint');
      }
    } catch (err) {
      console.error(err);
      setError('Prayer could not be fetched. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrayerPoint();
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []); // Scroll to bottom whenever messages change

  const handleEdit = () => {
    if (!prayerPoint) return;

    // Navigate to metadata screen with all the prayer data
    router.push({
      pathname: '/(tabs)/(prayers)/(createPrayer)/prayerMetadata',
      params: {
        id: prayerPoint.id,
        content: prayerPoint.content,
        privacy: prayerPoint.privacy,
        mode: 'edit',
      },
    });
  };

  const formattedDate = (() => {
    if (!prayerPoint?.createdAt) return 'Unknown Date'; // Handle missing date

    const date =
      prayerPoint.createdAt instanceof Date
        ? prayerPoint.createdAt
        : typeof prayerPoint.createdAt === 'object' &&
          'seconds' in prayerPoint.createdAt
          ? new Date(prayerPoint.createdAt.seconds * 1000)
          : new Date(prayerPoint.createdAt);

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
        prayerPoint && (
          <>
            <Stack.Screen
              options={{
                headerRight: () =>
                  isOwner && <HeaderButton onPress={handleEdit} label="Edit" />,
              }}
            />
            <ThemedText style={[styles.createdAtText, { color: textColor }]}>
              Created on: {formattedDate}
            </ThemedText>

            <PrayerContent
              editMode="view"
              prayerId={prayerPointId}
              prayerOrPrayerPoint={'prayerPoint'}
              backgroundColor={backgroundColor}
            />
          </>
        )
      )}
    </ThemedScrollView>
  );
};

const styles = StyleSheet.create({
  createdAtText: {
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 20,
    marginBottom: 0,
    paddingLeft: 20,
  },
  scrollView: {
    flex: 1,
    gap: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
});

export default PrayerPointView;
