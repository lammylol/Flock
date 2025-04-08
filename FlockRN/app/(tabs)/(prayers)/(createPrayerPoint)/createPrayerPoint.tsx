import { useState } from 'react';
import { TouchableOpacity, Alert, View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { prayerService } from '@/services/prayer/prayerService';
import { auth } from '@/firebase/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import {
  PrayerPoint,
  CreatePrayerPointDTO,
  PrayerTag,
  UpdatePrayerDTO,
  PrayerType,
} from '@/types/firebase';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function PrayerPointMetadataScreen() {
  const params = useLocalSearchParams<{
    content?: string;
    id?: string;
    title?: string;
    privacy?: string;
    tags?: string;
    mode?: string;
  }>();

  // Determine if we're in edit mode
  const isEditMode = params.mode === 'edit';
  const prayerId = params.id;

  // Parse tags if they exist in params
  const initialTags: PrayerTag[] = params.tags
    ? JSON.parse(params.tags as string)
    : [];

  const [content, setContent] = useState(params?.content || '');
  const [title, setTitle] = useState(params?.title || '');
  // TODO implement privacy setting
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [privacy, _setPrivacy] = useState<'public' | 'private'>(
    (params?.privacy as 'public' | 'private') || 'private',
  );
  const [selectedTags, setSelectedTags] = useState<PrayerTag[]>(initialTags);
  const [isLoading, setIsLoading] = useState(false);
  // const [isDeleting, setIsDeleting] = useState(false);
  const colorScheme = useThemeColor({}, 'backgroundSecondary');

  const handlePrayerPoints = async (
    prayerPoints: PrayerPoint[],
    prayerId: string,
  ): Promise<string[]> => {
    try {
      // Transform prayer points
      const mappedPrayerPoints: CreatePrayerPointDTO[] = prayerPoints.map(
        (prayerPoint) => ({
          title: prayerPoint.title?.trim() || 'Untitled',
          type: prayerPoint.type?.trim() as PrayerType,
          content: prayerPoint.content?.trim() || '',
          createdAt: new Date(),
          authorId: auth.currentUser?.uid || 'unknown',
          authorName: auth.currentUser?.displayName || 'Unknown',
          status: prayerPoint.status || 'open',
          privacy: prayerPoint.privacy ?? 'private',
          prayerId: prayerId,
          recipientName: prayerPoint.recipientName || 'Unknown', // Default to 'Unknown'
          prayerUpdates: prayerPoint.prayerUpdates || [], // Default to an empty array
          tags: prayerPoint.tags || [], // Default to an empty array
        }),
      );

      // Save to Firestore
      const prayerPointIds =
        await prayerService.addPrayerPoints(mappedPrayerPoints);

      return prayerPointIds;
    } catch (err) {
      console.error('Error parsing prayer points:', err);
      return [];
    }
  };

  // const handleDelete = async () => {
  //   // Confirm deletion
  //   Alert.alert(
  //     'Delete Prayer',
  //     'Are you sure you want to delete this prayer? This action cannot be undone.',
  //     [
  //       {
  //         text: 'Cancel',
  //         style: 'cancel',
  //       },
  //       {
  //         text: 'Delete',
  //         style: 'destructive',
  //         onPress: async () => {
  //           if (!prayerId || !auth.currentUser?.uid) {
  //             Alert.alert('Error', 'Cannot delete prayer');
  //             return;
  //           }

  //           setIsDeleting(true);
  //           try {
  //             await prayerService.deletePrayer(prayerId, auth.currentUser.uid);
  //             Alert.alert('Success', 'Prayer deleted successfully');
  //             router.push('/(tabs)/(prayers)');
  //           } catch (error) {
  //             console.error('Error deleting prayer:', error);
  //             Alert.alert(
  //               'Error',
  //               'Failed to delete prayer. Please try again.',
  //             );
  //           } finally {
  //             setIsDeleting(false);
  //           }
  //         },
  //       },
  //     ],
  //   );
  // };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please add a title');
      return;
    }

    if (!auth.currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to create a prayer');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && prayerId) {
        // // Update existing prayer
        // const updateData: UpdatePrayerDTO = {
        //   title: title.trim(),
        //   content: content,
        //   privacy: privacy,
        //   tags: selectedTags,
        // };
        // await prayerService.updatePrayer(prayerId, updateData);
        // Alert.alert('Success', 'Prayer updated successfully');
        // router.push('/(tabs)/(prayers)');
      } else {
        // Create new prayer point
        const prayerData: CreatePrayerPointDTO = {
          title: title.trim(),
          content: content,
          privacy: privacy,
          tags: selectedTags,
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName,
          status: 'open',
          isPinned: false,

          // Optional fields
          prayerId: prayerId, // Supports string or string[]
          type: type, // Single prayer type (legacy)
          recipientName: recipientName ?? '',
          recipientId: recipientId ?? '',
          prayerUpdates: prayerUpdates ?? [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const prayerId = await prayerService.createPrayer(prayerData);

        // get list of prayer point ids
        const prayerPointIds = await handlePrayerPoints(prayerPoints, prayerId);

        const updatePrayerPoints = {
          prayerPoints: prayerPointIds,
        } as UpdatePrayerDTO;

        // update the original prayer with the list of ids
        await prayerService.updatePrayer(prayerId, updatePrayerPoints);

        Alert.alert('Success', 'Prayer created successfully');
        router.dismissAll(); // resets 'createPrayer' stack.
        router.replace('/(tabs)/(prayers)');
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} prayer:`,
        error,
      );
      Alert.alert(
        'Error',
        `Failed to ${isEditMode ? 'update' : 'create'} prayer. Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedScrollView contentContainerStyle={styles.scrollContent}>
      <PrayerContent
        editMode={'create'}
        prayerOrPrayerPoint={'prayerPoint'}
        backgroundColor={colorScheme}
      ></PrayerContent>

      <View style={styles.section}>
        <View style={styles.privacySelector}>
          <ThemedText style={styles.label}>Privacy</ThemedText>
          <View style={styles.privacyValueContainer}>
            <ThemedText style={styles.privacyValue}>
              {privacy === 'private' ? 'Private' : 'Public'}
            </ThemedText>
            {privacy === 'private' && (
              <ThemedText style={styles.lockIcon}>🔒</ThemedText>
            )}
          </View>
        </View>
      </View>

      {/* {isEditMode && (
        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <ThemedText style={styles.deleteButtonText}>
            {isDeleting ? 'Deleting...' : 'Delete Prayer'}
          </ThemedText>
        </TouchableOpacity>
      )} */}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <ThemedText style={styles.buttonText}>
          {isLoading
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update Prayer'
              : 'Create Prayer'}
        </ThemedText>
      </TouchableOpacity>
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    bottom: 20,
    justifyContent: 'center',
    left: 20,
    paddingVertical: 16,
    position: 'absolute',
    right: 20,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: Colors.purple,
    borderRadius: 12,
    padding: 16,
  },
  deleteButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  lockIcon: {
    fontSize: 16,
  },
  privacySelector: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  privacyValue: {
    fontSize: 16,
    marginRight: 4,
  },
  privacyValueContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  scrollContent: {
    backgroundColor: Colors.light.background,
    flexGrow: 1,
    gap: 10,
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
  },
});
