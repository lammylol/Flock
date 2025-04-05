/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Prayer, PrayerPoint } from '@/types/firebase';
import { prayerService } from '@/services/prayer/prayerService';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import useAuthContext from '@/hooks/useAuthContext';
import { ThemedText } from '@/components/ThemedText';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';
import PrayerPointSection from '@/components/Prayer/PrayerViews/PrayerPointSection';
import { Colors } from '@/constants/Colors';
import { HeaderButton } from '@/components/ui/HeaderButton';
import TagsSection from '@/components/Prayer/PrayerViews/TagsSection';

const PrayerPointView = () => {
  const { prayerPoint } = useLocalSearchParams() as {
    prayerPoint: string;
  };
  const parsedPrayerPoint = prayerPoint ? JSON.parse(prayerPoint) : null;
  console.log('Parsed Prayer Point:', parsedPrayerPoint);
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[] | null>(null);
  const user = useAuthContext().user;
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'textPrimary');
  const isOwner = prayer && user && prayer.authorId === user.uid;
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchPrayerPoint = useCallback(async () => {
    try {
      const fetchedPrayer = await prayerService.getPrayer(id);
      setPrayer(fetchedPrayer);
      if (user && fetchedPrayer?.prayerPoints) {
        const fetchedPrayerPoints = await prayerService.getPrayerPoints(user);
        setPrayerPoints(fetchedPrayerPoints);
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
    fetchPrayer();
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
        id: parsedPrayerPoint.id,
        content: parsedPrayerPoint.content,
        privacy: parsedPrayerPoint.privacy,
        mode: 'edit',
      },
    });
  };

  const formattedDate = (() => {
    if (!parsedPrayerPoint?.createdAt) return 'Unknown Date'; // Handle missing date

    const date =
      parsedPrayerPoint.createdAt instanceof Date
        ? parsedPrayerPoint.createdAt
        : typeof parsedPrayerPoint.createdAt === 'object' &&
          'seconds' in parsedPrayerPoint.createdAt
          ? new Date(parsedPrayerPoint.createdAt.seconds * 1000)
          : new Date(parsedPrayerPoint.createdAt);

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
        parsedPrayerPoint && (
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
            <ThemedText style={[styles.createdAtText, { color: textColor }]}>
              Created at: {formattedDate}
            </ThemedText>

            <PrayerContent
              title={parsedPrayerPoint?.title}
              content={parsedPrayerPoint.content}
              backgroundColor={backgroundColor}
            />
            {prayerPoints && <PrayerPointSection prayerPoints={prayerPoints} />}
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
    marginBottom: 0,
  },
  scrollView: {
    flex: 1,
    gap: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
});

export default PrayerPointView;
