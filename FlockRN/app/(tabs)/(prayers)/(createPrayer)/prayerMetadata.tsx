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
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { useThemeColor } from '@/hooks/useThemeColor';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { EditMode } from '@/types/ComponentProps';
import { prayerPointService } from '@/services/prayer/prayerPointService';
import useFormState from '@/hooks/useFormState';
import { usePrayerHandler } from '@/hooks/prayerScreens/usePrayerHandler';
import { useAnalyzePrayer } from '@/hooks/prayerScreens/useAnalyzePrayer';

export default function PrayerMetadataScreen() {
  const { userOptInFlags } = useUserContext();
  const openAiService = OpenAiService.getInstance();
  const params = useLocalSearchParams() as {
    content?: string;
    id?: string;
    editMode?: EditMode;
    hasTranscription?: boolean;
  };

  const processedParams = useMemo(() => {
    return {
      content: params.content ?? '',
      id: params.id ?? '',
      editMode: (params.editMode as EditMode) ?? EditMode.CREATE,
      hasTranscription: params.hasTranscription ?? false,
    };
  }, [params.content, params.id, params.editMode, params.hasTranscription]);

  // Determine if we're in edit mode
  const { transcription, isTranscribing } = useRecording();
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);

  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const { content, id, editMode, hasTranscription } = processedParams;

  const {
    formState,
    isDeleting,
    isSubmissionLoading,
    isDataLoading,
    setIsDataLoading,
    setIsSubmissionLoading,
    setIsDeleting,
    setPrivacy,
  } = useFormState({
    editMode: editMode,
  });

  const {
    updatedPrayer,
    handlePrayerUpdate,
    createPrayer,
    updatePrayer,
    loadPrayer,
  } = usePrayerHandler({
    id: id,
    content: content,
    privacy: formState.privacy,
  });

  useEffect(() => {
    if (!formState.isEditMode) return;

    const setup = async () => {
      setIsDataLoading(true);
      await loadPrayer();
      setIsDataLoading(false);
    };

    setup();
  }, [formState.isEditMode, loadPrayer, setIsDataLoading]);

  const getContent = useCallback(async (): Promise<{
    content: string;
    isTranscribed: boolean;
  }> => {
    const placeholderText = 'transcribing..';
    const transcriptionUnavailableText = 'transcription unavailable';

    if (isTranscribing) {
      return { content: placeholderText, isTranscribed: false };
    } else if (transcription || (content && content !== placeholderText)) {
      return { content: transcription || content, isTranscribed: true };
    } else {
      return { content: transcriptionUnavailableText, isTranscribed: false };
    }
  }, [content, isTranscribing, transcription]);

  const { analyzeContent, isAnalyzing, hasAnalyzed } = useAnalyzePrayer({
    transcription,
    userOptInAI: userOptInFlags.optInAI,
    handlePrayerUpdate: handlePrayerUpdate,
  });

  useEffect(() => {
    const checkAndAnalyze = async () => {
      const shouldAnalyze =
        !hasAnalyzed && !isAnalyzing && !formState.isEditMode;

      if (!shouldAnalyze) return;

      if (hasTranscription) {
        const { content, isTranscribed } = await getContent();
        if (isTranscribed) {
          await analyzeContent(content);
        }
      } else {
        await analyzeContent(content);
      }
    };

    checkAndAnalyze();
  }, [
    analyzeContent,
    content,
    formState.isEditMode,
    getContent,
    hasAnalyzed,
    hasTranscription,
    isAnalyzing,
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
            if (!id || !auth.currentUser?.uid) {
              Alert.alert('Error', 'Cannot delete prayer');
              return;
            }

            setIsDeleting(true);
            try {
              await prayerService.deletePrayer(id, auth.currentUser.uid);
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
    setIsSubmissionLoading(true);
    try {
      if (formState.isEditMode && updatedPrayer) {
        // Update existing prayer
        updatePrayer(updatedPrayer);
        Alert.alert('Success', 'Prayer updated successfully');
        router.push('/(tabs)/(prayers)');
      } else {
        // Create new prayer
        createPrayer(updatedPrayer);

        // get list of prayer point ids
        const prayerPointIds = await handlePrayerPoints(prayerPoints, id);

        const updatePrayerPoints = {
          prayerPoints: prayerPointIds,
        } as UpdatePrayerDTO;

        // update the original prayer with the list of ids
        await prayerService.updatePrayer(id, updatePrayerPoints);

        Alert.alert('Success', 'Prayer created successfully');
        router.replace('/(tabs)/(prayers)');
      }
    } catch (error) {
      console.error(
        `Error ${formState.isEditMode ? 'updating' : 'creating'} prayer:`,
        error,
      );
      Alert.alert(
        'Error',
        `Failed to ${formState.isEditMode ? 'update' : 'create'} prayer. Please try again.`,
      );
    } finally {
      setIsSubmissionLoading(false);
    }
  };

  return (
    <ThemedScrollView contentContainerStyle={styles.scrollContent}>
      <Stack.Screen
        options={{
          headerTitle: formState.isEditMode ? 'Edit Prayer' : 'Create Prayer',
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
        editMode={formState.isEditMode ? EditMode.EDIT : EditMode.CREATE}
        backgroundColor={colorScheme}
        prayerOrPrayerPoint={EntityType.Prayer}
        prayer={updatedPrayer}
        onChange={(updatedPrayer) => {
          handlePrayerUpdate(updatedPrayer as Prayer);
        }}
      />
      {isTranscribing ||
        isDataLoading ||
        (isAnalyzing && <ActivityIndicator color="#9747FF" size="small" />)}

      <TouchableOpacity
        style={[styles.button, isSubmissionLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmissionLoading}
      >
        <ThemedText style={styles.buttonText}>
          {isSubmissionLoading
            ? formState.isEditMode
              ? 'Updating...'
              : 'Creating...'
            : formState.isEditMode
              ? 'Update Prayer'
              : 'Create Prayer'}
        </ThemedText>
      </TouchableOpacity>

      {formState.isEditMode && (
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
