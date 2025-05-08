/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import useAuthContext from '@/hooks/useAuthContext';
import { ThemedText } from '@/components/ThemedText';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { Colors } from '@/constants/Colors';
import { auth } from '@/firebase/firebaseConfig';
import { EntityType } from '@/types/PrayerSubtypes';
import { EditMode } from '@/types/ComponentProps';
import { complexPrayerOperations } from '@/services/prayer/complexPrayerOperations';
import PrayerPointSection from '@/components/Prayer/PrayerViews/PrayerPointSection';
import { prayerTopicService } from '@/services/prayer/prayerTopicService';
import { PrayerPoint } from '@/types/firebase';

const PrayerTopicView = () => {
  const { id } = useLocalSearchParams() as {
    id: string;
  };

  const { userPrayerTopics, updateCollection, removeFromCollection } =
    usePrayerCollection();

  // Use the collection to get the latest data
  const prayerTopic = userPrayerTopics.find((p) => p.id === id) || null;

  const user = useAuthContext().user;
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'textPrimary');
  const isOwner = prayerTopic && user && prayerTopic.authorId === user.uid;
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

  const handleEdit = () => {
    if (!prayerTopic) return;

    console.log('Preparing to edit prayer point:', prayerTopic.id);

    try {
      // Be explicit with the complete path to the specific file
      router.push({
        pathname: '/(tabs)/(prayers)/createPrayerPoint',
        params: {
          id: prayerTopic.id,
          editMode: EditMode.EDIT,
        },
      });
    } catch (error) {
      console.error('Error navigating to edit screen:', error);
      Alert.alert('Error', 'Failed to navigate to edit screen');
    }
  };

  const handleDelete = () => {
    if (!prayerTopic || !auth.currentUser?.uid) return;

    // Confirm deletion
    Alert.alert(
      'Delete Prayer Point',
      'Are you sure you want to delete this prayer point? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await complexPrayerOperations.deletePrayerPointAndUnlinkPrayers(
                id,
                auth.currentUser!.uid,
              );

              // Remove from local collection
              if (removeFromCollection) {
                removeFromCollection(id, 'prayerPoint');
              }

              Alert.alert('Success', 'Prayer point deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting prayer point:', error);
              Alert.alert(
                'Error',
                'Failed to delete prayer point. Please try again.',
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

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
  deleteButton: {
    alignItems: 'center',
    backgroundColor: Colors.purple,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 20,
    paddingVertical: 16,
  },
  deleteButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
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
  // Add a spacer that will push content up and delete button to the bottom
  spacer: {
    flex: 1,
    minHeight: 20, // Minimum height to ensure some spacing even when content is long
  },
});

export default PrayerTopicView;
