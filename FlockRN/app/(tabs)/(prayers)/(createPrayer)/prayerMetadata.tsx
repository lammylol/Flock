import { useCallback, useEffect, useMemo } from 'react';
import {
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { auth } from '@/firebase/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import {
  PrayerPoint,
  Prayer,
  FlatPrayerTopicDTO,
  LinkedPrayerEntity,
} from '@/types/firebase';
import useRecording from '@/hooks/recording/useRecording';
import PrayerPointSection from '@/components/Prayer/PrayerViews/PrayerPointSection';
import useUserContext from '@/hooks/useUserContext';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { EntityType } from '@/types/PrayerSubtypes';
import { useThemeColor } from '@/hooks/useThemeColor';
import { EditMode } from '@/types/ComponentProps';
import useFormState from '@/hooks/useFormState';
import { useAnalyzePrayer } from '@/hooks/prayerScreens/useAnalyzePrayer';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { usePrayerMetadataContext } from '@/context/PrayerMetadataContext';
import { submitOperationsService } from '@/services/prayer/submitOperationsService';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';

export default function PrayerMetadataScreen() {
  const { userOptInFlags } = useUserContext();
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
  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const { content, id, editMode, hasTranscription } = processedParams;
  const user = auth.currentUser;
  const { updateCollection } = usePrayerCollection();

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
    prayer,
    handlePrayerUpdate,
    createPrayer,
    updatePrayer,
    loadPrayer,
    deletePrayer,
    prayerPoints,
    setPrayerPoints,
    linkedPrayerPairs,
    reset,
  } = usePrayerMetadataContext();

  useEffect(() => {
    // this guard guarantees no infinite loop.
    if (!formState.isEditMode || !id || !prayer || prayer.id === id) return;

    const setup = async () => {
      setIsDataLoading(true);
      await loadPrayer(id);
      setIsDataLoading(false);
    };

    setup();
  }, [formState.isEditMode, id, loadPrayer, prayer, setIsDataLoading]);

  const getContent = useCallback(async (): Promise<{
    content: string;
    isTranscribed: boolean;
  }> => {
    const placeholderText = 'transcribing..';
    const transcriptionUnavailableText = 'transcription unavailable';

    if (transcription && transcription !== placeholderText) {
      return { content: transcription, isTranscribed: true };
    } else if (isTranscribing) {
      return { content: placeholderText, isTranscribed: false };
    } else if (content && content !== placeholderText) {
      return { content, isTranscribed: true };
    } else {
      return { content: transcriptionUnavailableText, isTranscribed: false };
    }
  }, [content, isTranscribing, transcription]);

  const { analyzeContent, isAnalyzing, hasAnalyzed } = useAnalyzePrayer({
    transcription,
    userOptInAI: userOptInFlags.optInAI,
    handlePrayerUpdate,
  });

  useEffect(() => {
    const checkAndAnalyze = async () => {
      const shouldAnalyze =
        !hasAnalyzed && !isAnalyzing && !formState.isEditMode;

      if (!shouldAnalyze) return;

      let contentToAnalyze = content;

      if (hasTranscription) {
        const { content, isTranscribed } = await getContent();
        if (!isTranscribed) return;
        contentToAnalyze = content;
      }

      const prayerPoints = await analyzeContent(contentToAnalyze);
      setPrayerPoints(prayerPoints as PrayerPoint[]);
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
    setPrayerPoints,
  ]);

  const getLinkedPrayers = async (point: PrayerPoint) => {
    // find any linked prayers to prayer
    const linkedData = linkedPrayerPairs.find(
      (lp) => lp.prayerPoint.id === point.id,
    );
    if (linkedData) {
      return {
        prayerPoint: linkedData.prayerPoint,
        embedding: linkedData.prayerPointEmbedding,
        originPrayer: linkedData.originPrayer,
        topicDTO: linkedData.topicTitle,
      };
    }
    return {
      prayerPoint: point,
      embedding: point.embedding || undefined,
      originPrayer: undefined,
      topicDTO: undefined,
    };
  };

  const handleSubmit = async () => {
    if (!auth.currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to create a prayer');
      return;
    }

    setPrivacy('private'); // temporary set function to bypass lint for now.
    setIsSubmissionLoading(true);
    try {
      if (formState.isEditMode && prayer) {
        // Update existing prayer
        await updatePrayer(prayer);
        Alert.alert('Success', 'Prayer updated successfully');
        router.push('/(tabs)/(prayers)');
      } else {
        // Create new prayer
        if (!prayer) {
          Alert.alert('Error', 'Prayer data is missing. Please try again.');
          return;
        }
        if (!user?.uid) {
          Alert.alert('Error', 'User data is missing. Please try again.');
          return;
        }
        const prayerId = await createPrayer(prayer);

        Promise.all(
          prayerPoints.map(async (point) => {
            const prayerPointWithPrayerId = {
              ...point,
              prayerId: prayerId,
            };

            // find linked pairs
            const linkedData = await getLinkedPrayers(point);

            const newPrayerPoint =
              await submitOperationsService.submitPrayerPointWithEmbeddingsAndLinking(
                {
                  formState,
                  prayerPoint: prayerPointWithPrayerId as PrayerPoint,
                  originPrayer: linkedData.originPrayer as
                    | LinkedPrayerEntity
                    | undefined,
                  prayerTopicDTO: linkedData.topicDTO as
                    | FlatPrayerTopicDTO
                    | undefined,
                  user,
                  embedding: linkedData.embedding as number[] | undefined,
                },
              );

            updateCollection(
              { ...newPrayerPoint } as PrayerPoint,
              'prayerPoint',
            );
          }),
        );
      }
      Alert.alert('Success', 'Prayer created successfully');
      router.replace('/(tabs)/(prayers)');
      router.dismissAll();
      reset();
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

  const handleDelete = () => {
    Alert.alert(
      'Delete Prayer',
      'Are you sure you want to delete this prayer? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            await deletePrayer(
              id,
              () => {
                Alert.alert('Success', 'Prayer deleted successfully');
                router.push('/(tabs)/(prayers)');
              },
              () => {
                // Optional failure callback
              },
            );
            setIsDeleting(false);
            router.dismissAll();
          },
        },
      ],
    );
  };

  return (
    <ThemedScrollView contentContainerStyle={styles.scrollContent}>
      <Stack.Screen
        options={{
          headerTitle: formState.isEditMode ? 'Edit Prayer' : 'Create Prayer',
          headerTitleStyle: styles.headerTitleStyle,
          headerLeft: () => <HeaderButton onPress={router.back} label="Back" />,
        }}
      />
      <ThemedText type="default" style={styles.headerText}>
        Here's a summary of what you prayed:
      </ThemedText>
      <PrayerPointSection
        prayerPoints={prayerPoints}
        isPrayerCardsEditable={true}
      />

      <PrayerContent
        editMode={formState.isEditMode ? EditMode.EDIT : EditMode.CREATE}
        backgroundColor={colorScheme}
        prayerOrPrayerPoint={EntityType.Prayer}
        prayer={prayer ?? undefined}
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
