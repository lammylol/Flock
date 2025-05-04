import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { useThemeColor } from '@/hooks/useThemeColor';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { EditMode } from '@/types/ComponentProps';
import { prayerPointService } from '@/services/prayer/prayerPointService';
import useFormState from '@/hooks/useFormState';

export default function PrayerMetadataScreen() {
  const { userOptInFlags } = useUserContext();
  const openAiService = OpenAiService.getInstance();
  const params = useLocalSearchParams<{
    content?: string;
    id?: string;
    editMode?: EditMode;
  }>();

  const processedParams = useMemo(() => {
    return {
      content: params.content ?? '',
      id: params.id ?? '',
      editMode: (params.editMode as EditMode) ?? EditMode.CREATE,
    };
  }, [params.content, params.id, params.editMode]);

  // Determine if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { transcription, isTranscribing } = useRecording();
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);
  const { userPrayers, updateCollection } = usePrayerCollection();
  const [prayer, setUpdatedPrayer] = useState<Prayer>({
    id: processedParams.id || '',
    title: '',
    content: processedParams.content || '',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: '',
    authorId: '',
    privacy: 'private',
    prayerPoints: [],
    entityType: EntityType.Prayer,
  });

  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const { content, id, editMode } = processedParams;

  const {
    formState,
    isDeleting,
    isSubmissionLoading,
    setIsDataLoading,
    setIsSubmissionLoading,
    setIsDeleting,
    setPrivacy,
  } = useFormState({
    editMode: editMode,
  });

  const analyzeContent = useCallback(async () => {
    setIsAnalyzing(true);
    const content = transcription || processedParams.content || '';
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
      }));

      setPrayerPoints(updatedPrayerPoints);
    } catch (error) {
      console.error('Error using AI fill:', error);
      // Silent fail - don't show error to user for automatic fill
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    transcription,
    processedParams.content,
    openAiService,
    userOptInFlags.optInAI,
  ]);

  const loadPrayer = useCallback(async () => {
    if (!processedParams.id) return;

    // Look for prayer
    const contextPrayer = userPrayers.find((p) => p.id === processedParams.id);

    if (contextPrayer) {
      setUpdatedPrayer({ ...contextPrayer });
      return;
    }

    try {
      const fetchedPrayer = await prayerService.getPrayer(processedParams.id);
      if (fetchedPrayer) {
        setUpdatedPrayer({ ...fetchedPrayer });
      }
    } catch (error) {
      console.error('Error loading prayer:', error);
    }
  }, [processedParams.id, userPrayers]);

  // setup editor state and load prayer point data
  useEffect(() => {
    const setup = async () => {
      setIsDataLoading(true);
      await loadPrayer();
      setIsDataLoading(false);
    };
    if (formState.isEditMode) setup();
  }, [loadPrayer, formState.isEditMode, setIsDataLoading]);

  const setupEditMode = useCallback(async () => {
    // Check if we're in edit mode from URL params
    if (processedParams.editMode === EditMode.EDIT && processedParams.id) {
      setIsEditMode(true);
      loadPrayer();
    } else {
      setIsEditMode(false);
      if (isTranscribing) {
        setUpdatedPrayer((prevPrayer) => ({
          ...prevPrayer,
          content: 'transcribing...',
        }));
      } else if (transcription || processedParams.content) {
        analyzeContent();
      } else if (transcription === '') {
        setUpdatedPrayer((prevPrayer) => ({
          ...prevPrayer,
          content: 'Transcription Unavailable',
        }));
      }
    }
  }, [
    processedParams.editMode,
    processedParams.id,
    processedParams.content,
    loadPrayer,
    isTranscribing,
    transcription,
    analyzeContent,
  ]);

  const handlePrayerPoints = async (
    prayerPoints: PrayerPoint[],
    prayerId: string,
  ): Promise<string[]> => {
    try {
      // Get prayer point embedding.
      const updatedPrayerPoints: PrayerPoint[] = await Promise.all(
        prayerPoints.map(async (point) => {
          if (userOptInFlags.optInAI) {
            const input = `${point.title} ${point.content}`.trim();
            const embeddingInput =
              await openAiService.getVectorEmbeddings(input);

            if (embeddingInput.length > 0) {
              return {
                ...point,
                embedding: embeddingInput,
              };
            } else {
              console.warn('No embedding generated for point:', point);
            }
          }
          return point; // Return original if opt-out or embedding failed
        }),
      );

      // Transform prayer points
      const mappedPrayerPoints: CreatePrayerPointDTO[] =
        updatedPrayerPoints.map((prayerPoint) => ({
          title: prayerPoint.title?.trim() || 'Untitled',
          // Convert types array to a single type if needed for backward compatibility
          prayerType: prayerPoint.prayerType || PrayerType.Request,
          tags: prayerPoint.prayerType
            ? [prayerPoint.prayerType]
            : [PrayerType.Request],
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
          ...(prayerPoint.embedding?.length
            ? { embedding: prayerPoint.embedding }
            : {}), // Only include if it exists. This is essential for embedding search. NaN values will break the search.
        }));

      // Save to Firestore
      const prayerPointIds =
        await prayerPointService.addPrayerPoints(mappedPrayerPoints);

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
        isEditable={true}
        onChange={(updatedPrayerPoints: PrayerPoint[]) =>
          setPrayerPoints(updatedPrayerPoints)
        }
      />

      <PrayerContent
        editMode={isEditMode ? EditMode.EDIT : EditMode.CREATE}
        backgroundColor={colorScheme}
        prayerOrPrayerPoint={EntityType.Prayer}
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
    marginBottom: 20,
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
});
