/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, View } from 'react-native';
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
import { Colors } from '@/constants/Colors';
import { auth } from '@/firebase/firebaseConfig';

const PrayerPointView = () => {
  const { id: prayerPointId } = useLocalSearchParams() as {
    id: string;
  };

  const { userPrayerPoints, updateCollection, removeFromCollection } = usePrayerCollection();

  // Use the collection to get the latest data
  const prayerPoint =
    userPrayerPoints.find((p) => p.id === prayerPointId) || null;

  const user = useAuthContext().user;
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
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
  }, [prayerPointId, updateCollection]);

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
  
  const handleDelete = () => {
    if (!prayerPoint || !auth.currentUser?.uid) return;
    
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
              await prayerService.deletePrayerPoint(prayerPointId, auth.currentUser.uid);
              
              // Remove from local collection if you have a function for this
              if (removeFromCollection) {
                removeFromCollection(prayerPointId, 'prayerPoint');
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

  // Show loading indicator if deleting
  if (isDeleting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <ThemedText style={styles.loadingText}>Deleting prayer point...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: useThemeColor({}, 'background') }]}>
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
              
              {/* Spacer to push content up and button to bottom */}
              <View style={styles.spacer} />
            </>
          )
        )}
      </ThemedScrollView>
      
      {/* Delete button - only show for owners, positioned at bottom */}
      {!error && prayerPoint && isOwner && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <ThemedText style={styles.deleteButtonText}>
            Delete Prayer Point
          </ThemedText>
        </TouchableOpacity>
      )}
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
    marginHorizontal: 20,
    marginBottom: 20, // Add space between button and bottom of screen
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

export default PrayerPointView;