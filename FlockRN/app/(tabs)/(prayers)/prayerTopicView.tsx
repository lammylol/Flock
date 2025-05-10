/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { ThemedText } from '@/components/ThemedText';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { Colors } from '@/constants/Colors';
import { EntityType } from '@/types/PrayerSubtypes';
import { EditMode } from '@/types/ComponentProps';
import PrayerPointSection from '@/components/Prayer/PrayerViews/PrayerPointSection';
import { prayerTopicService } from '@/services/prayer/prayerTopicService';
import { PrayerPoint } from '@/types/firebase';

const PrayerTopicView = () => {
  const { id } = useLocalSearchParams() as {
    id: string;
  };

  const { userPrayerTopics, updateCollection } = usePrayerCollection();

  // Use the collection to get the latest data
  const prayerTopic = userPrayerTopics.find((p) => p.id === id) || null;

  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'textPrimary');
  // const isOwner = prayerTopic && user && prayerTopic.authorId === user.uid;
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchPrayerTopic = useCallback(async () => {
    try {
      const fetchedPrayer = await prayerTopicService.getPrayerTopic(id);
      if (fetchedPrayer) {
        updateCollection(fetchedPrayer, 'prayerTopic');
      }
    } catch (err) {
      console.error(err);
      setError('Prayer could not be fetched. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [id, updateCollection]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrayerTopic();
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []); // Scroll to bottom whenever messages change

  const formattedDate = (() => {
    if (!prayerTopic?.createdAt) return 'Unknown Date'; // Handle missing date

    const date =
      prayerTopic.createdAt instanceof Date
        ? prayerTopic.createdAt
        : typeof prayerTopic.createdAt === 'object' &&
          'seconds' in prayerTopic.createdAt
          ? new Date(prayerTopic.createdAt.seconds * 1000)
          : new Date(prayerTopic.createdAt);

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  })();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: useThemeColor({}, 'background') },
      ]}
    >
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
        ) : isDeleting ? (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ContentUnavailable
              errorTitle="Deleting Prayer Point"
              errorMessage="Your prayer point is being deleted right now."
            />
          </>
        ) : prayerTopic ? (
          <>
            {/* <Stack.Screen
              options={{
                headerRight: () =>
                  isOwner && <HeaderButton onPress={handleEdit} label="Edit" />,
              }}
            /> */}
            <ThemedText style={[styles.createdAtText, { color: textColor }]}>
              Created on: {formattedDate}
            </ThemedText>

            <PrayerContent
              editMode={EditMode.VIEW}
              prayer={prayerTopic}
              prayerOrPrayerPoint={EntityType.PrayerPoint}
              backgroundColor={backgroundColor}
            />
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ThemedText style={styles.loadingText}>
              Loading prayer point...
            </ThemedText>
          </View>
        )}
        <PrayerPointSection
          prayerPoints={(prayerTopic?.journey as PrayerPoint[]) || []}
        />

        {/* Spacer to push content up and button to bottom */}
      </ThemedScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createdAtText: {
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 20,
    marginBottom: 0,
    paddingLeft: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
    gap: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
});

export default PrayerTopicView;
