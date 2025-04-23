import { useCallback, useMemo, useRef, useState } from 'react';
import {
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { prayerService } from '@/services/prayer/prayerService';
import { auth } from '@/firebase/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import uuid from 'react-native-uuid';
import {
  CreatePrayerDTO,
  PrayerPoint,
  CreatePrayerPointDTO,
  UpdatePrayerDTO,
  Prayer,
} from '@/types/firebase';
import useRecording from '@/hooks/recording/useRecording';
import PrayerPointSection from '@/components/Prayer/PrayerViews/PrayerPointSection';
import useUserContext from '@/hooks/useUserContext';
import OpenAiService from '@/services/ai/openAIService';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { PrayerOrPrayerPointType } from '@/types/PrayerSubtypes';
import { useThemeColor } from '@/hooks/useThemeColor';
import { HeaderButton } from '@/components/ui/HeaderButton';

export default function PrayerMetadataScreen() {
  const { userOptInFlags } = useUserContext();
  const openAiService = OpenAiService.getInstance();
  const processedParamsRef = useRef({
    content: '',
    id: '',
    mode: '',
  });

  const params = useLocalSearchParams<{
    content?: string;
    id?: string;
    mode?: string;
  }>();

  // Determine if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { transcription, isTranscribing } = useRecording();
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);
  const { userPrayers, updateCollection } = usePrayerCollection();
  const [prayer, setUpdatedPrayer] = useState<Prayer>({
    id: params.id || '',
    title: '',
    content: params.content || '',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: '',
    authorId: '',
    privacy: 'private',
    prayerPoints: [],
  });
  const colorScheme = useThemeColor({}, 'backgroundSecondary');

  const analyzeContent = useCallback(async () => {
    setIsAnalyzing(true);
    const content = transcription || params.content || '';
    try {
      const analysis = await openAiService.analyzePrayerContent(
        content,
        !!transcription,
        userOptInFlags.optInAI,
      );

      setUpdatedPrayer((prevPrayer) => ({
        ...prevPrayer,
        content: analysis.cleanedTranscription || content,
      }));

      const updatedPrayerPoints = analysis.prayerPoints.map((point) => ({
        ...point,
        id: uuid.v4(), // Ensure each has a unique ID
        // Initialize with default type as array for new UI
        types: point.type ? [point.type] : ['request'],
      }));

      setPrayerPoints(updatedPrayerPoints);
    } catch (error) {
      console.error('Error using AI fill:', error);
      // Silent fail - don't show error to user for automatic fill
    } finally {
      setIsAnalyzing(false);
    }
  }, [transcription, params.content, openAiService, userOptInFlags.optInAI]);

  const setupEditMode = useCallback(async () => {
    console.log('⭐ Setting up edit mode check');
    console.log('⭐ Mode:', params.mode);
    console.log('⭐ ID:', params.id);

    // Update our tracking ref
    processedParamsRef.current = {
      content: params.content || '',
      id: params.id || '',
      mode: params.mode || '',
    };

    // Check if we're in edit mode from URL params
    if (params.mode === 'edit' && params.id) {
      console.log('⭐ Edit mode detected from URL params');
      setIsEditMode(true);

      // First, try to find the prayer point in context
      const contextPrayerPoint = userPrayers.find((p) => p.id === params.id);

      if (contextPrayerPoint) {
        console.log(
          '⭐ Found prayer point in context:',
          JSON.stringify({
            id: contextPrayerPoint.id,
            title: contextPrayerPoint.title,
            content: contextPrayerPoint.content?.substring(0, 20) + '...',
            tags: contextPrayerPoint.tags,
            privacy: contextPrayerPoint.privacy,
            prayerPoints: contextPrayerPoint.prayerPoints,
            createdAt: contextPrayerPoint.createdAt,
            updatedAt: contextPrayerPoint.updatedAt,
            authorName: contextPrayerPoint.authorName,
            authorId: contextPrayerPoint.authorId,
          }),
        );

        // Set initial data from context
        setUpdatedPrayer({
          ...contextPrayerPoint,
        });
      } else {
        console.log(
          '⭐ Prayer point not found in context. Fetching from API...',
        );

        try {
          const fetchedPrayer = await prayerService.getPrayer(params.id);
          if (fetchedPrayer) {
            console.log('⭐ Fetched prayer from API');
            setUpdatedPrayer({
              ...fetchedPrayer,
            });
          }
        } catch (error) {
          console.error('⭐ Error fetching prayer point:', error);
        }
      }
    } else {
      console.log('⭐ Create mode detected');
      setIsEditMode(false);
      setUpdatedPrayer((prevPrayer) => ({
        ...prevPrayer,
        content: params.content || '',
      }));

      if (isTranscribing) {
        setUpdatedPrayer((prevPrayer) => ({
          ...prevPrayer,
          content: 'transcribing...',
        }));
      } else if (transcription || params.content) {
        if (transcription) {
          setUpdatedPrayer((prevPrayer) => ({
            ...prevPrayer,
            content: transcription,
          }));
        }
        analyzeContent();
      } else if (transcription === '') {
        setUpdatedPrayer((prevPrayer) => ({
          ...prevPrayer,
          content: 'Transcription Unavailable',
        }));
      }
    }
  }, [
    params.mode,
    params.id,
    params.content,
    userPrayers,
    isTranscribing,
    transcription,
    analyzeContent,
  ]);

  const handlePrayerPoints = async (
    prayerPoints: PrayerPoint[],
    prayerId: string,
  ): Promise<string[]> => {
    try {
      // Transform prayer points
      const mappedPrayerPoints: CreatePrayerPointDTO[] = prayerPoints.map(
        (prayerPoint) => ({
          title: prayerPoint.title?.trim() || 'Untitled',
          // Convert types array to a single type if needed for backward compatibility
          type: prayerPoint.type || 'request',
          tags: prayerPoint.type ? [prayerPoint.type] : ['request'],
          content: prayerPoint.content?.trim() || '',
          createdAt: new Date(),
          authorId: auth.currentUser?.uid || 'unknown',
          authorName: auth.currentUser?.displayName || 'Unknown',
          status: prayerPoint.status || 'open',
          privacy: prayerPoint.privacy ?? 'private',
          prayerId: prayerId,
          recipientName: prayerPoint.recipientName || 'Unknown', // Default to 'Unknown'
          prayerUpdates: prayerPoint.prayerUpdates || [], // Default to an empty array
          isOrigin:
            prayerPoint.isOrigin !== undefined ? prayerPoint.isOrigin : true,
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

  useMemo(() => {
    setupEditMode();
  }, [setupEditMode]);

  const handlePrayerUpdate = (updatedPrayerData: Prayer) => {
    setUpdatedPrayer((prevPrayer) => ({
      ...prevPrayer,
      ...updatedPrayerData,
    }));
  };

  const handleDelete = async () => {
    // Confirm deletion
    Alert.alert(
      'Delete Prayer',
      'Are you sure you want to delete this prayer? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!prayer.id || !auth.currentUser?.uid) {
              Alert.alert('Error', 'Cannot delete prayer');
              return;
            }

            setIsDeleting(true);
            try {
              await prayerService.deletePrayer(prayer.id, auth.currentUser.uid);
              Alert.alert('Success', 'Prayer deleted successfully');
              router.push('/(tabs)/(prayers)');
            } catch (error) {
              console.error('Error deleting prayer:', error);
              Alert.alert(
                'Error',
                'Failed to delete prayer. Please try again.',
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleSubmit = async () => {
    if (!auth.currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to create a prayer');
      return;
    }

    setPrivacy('private'); // temporary set function to bypass lint for now.
    setIsLoading(true);
    try {
      if (isEditMode && prayer) {
        // Update existing prayer
        const updateData: UpdatePrayerDTO = {
          content: prayer.content,
          privacy: privacy,
        };

        await prayerService.updatePrayer(prayer.id, updateData);
        updateCollection(prayer as Prayer, 'prayer');
        Alert.alert('Success', 'Prayer updated successfully');
        router.push('/(tabs)/(prayers)');
      } else {
        // Create new prayer
        const prayerData: CreatePrayerDTO = {
          content: prayer.content,
          privacy: prayer.privacy,
          tags: [], // Empty tags array since we've removed the feature
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName ?? 'Unknown',
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
        router.replace('/(tabs)/(prayers)');
        // router.dismissAll(); // resets 'createPrayer' stack.
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
      <Stack.Screen
        options={{
          headerTitle: isEditMode ? 'Edit Prayer' : 'Create Prayer',
          headerTitleStyle: styles.headerTitleStyle,
          headerLeft: () => (
            <HeaderButton onPress={router.back} label="Cancel" />
          ),
        }}
      />
      <ThemedText type="default" style={styles.headerText}>
        Here's a summary of what you prayed:
      </ThemedText>
      <PrayerPointSection
        prayerPoints={prayerPoints}
        onChange={(updatedPrayerPoints: PrayerPoint[]) =>
          setPrayerPoints(updatedPrayerPoints)
        }
      />

      <PrayerContent
        editMode={isEditMode ? 'edit' : 'create'}
        backgroundColor={colorScheme}
        prayerOrPrayerPoint={PrayerOrPrayerPointType.Prayer}
        prayer={prayer}
        onChange={(updatedPrayer) => {
          handlePrayerUpdate(updatedPrayer as Prayer);
        }}
      />
      {isTranscribing && <ActivityIndicator color="#9747FF" size="small" />}
      {isAnalyzing && (
        <ActivityIndicator
          color={Colors.primary}
          size="small"
          style={styles.activityIndicator}
        />
      )}

      {/* Spacer view to push content up and button to bottom */}
      <View style={styles.spacer} />

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

      {isEditMode && (
        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <ThemedText style={styles.deleteButtonText}>
            {isDeleting ? 'Deleting...' : 'Delete Prayer'}
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  activityIndicator: {
    alignSelf: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.purple,
    borderRadius: 12,
    flexDirection: 'row',
    height: 60, // Fixed height for the button
    justifyContent: 'center',
    marginTop: 10,
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  deleteButton: {
    alignItems: 'center',
    // backgroundColor: Colors.red,
    borderColor: Colors.red,
    borderWidth: 1,
    borderRadius: 12,
    height: 60, // Fixed height to match the submit button
    marginTop: 10,
    padding: 16,
  },
  deleteButtonText: {
    color: Colors.red,
    fontSize: 16,
    fontWeight: '600',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    backgroundColor: Colors.light.background,
    flexGrow: 1,
    gap: 15,
    padding: 16,
    paddingBottom: 24,
  },
  // Add a spacer that will push content up and buttons to the bottom
  spacer: {
    flex: 1,
    minHeight: 20, // Minimum height to ensure some spacing even when content is long
  },
});
