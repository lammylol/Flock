import { useCallback, useEffect, useState } from 'react';
import {
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
} from '@/types/firebase';
import useRecording from '@/hooks/recording/useRecording';
import PrayerPointSection from '@/components/Prayer/PrayerViews/PrayerPointSection';
import useUserContext from '@/hooks/useUserContext';
import OpenAiService from '@/services/ai/openAIService';

export default function PrayerMetadataScreen() {
  const { userOptInFlags } = useUserContext();
  const openAiService = OpenAiService.getInstance();
  const params = useLocalSearchParams<{
    content?: string;
    id?: string;
    title?: string;
    privacy?: string;
    mode?: string;
  }>();

  // Determine if we're in edit mode
  const isEditMode = params.mode === 'edit';
  const prayerId = params.id;

  const [content, setContent] = useState(params?.content || '');
  const [title, setTitle] = useState(params?.title || '');
  const [privacy, setPrivacy] = useState<'public' | 'private'>(
    (params?.privacy as 'public' | 'private') || 'private',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { transcription, isTranscribing } = useRecording();
  const [placeholder, setPlaceholder] = useState('Enter your prayer here');
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);

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
          type: (prayerPoint.type && prayerPoint.type.length > 0
            ? prayerPoint.type[0]
            : 'request') as 'request' | 'praise' | 'repentance',
          // Store the full types array for the new functionality
          types: prayerPoint.type || ['request'],
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

  const analyzeContent = useCallback(async () => {
    setIsAnalyzing(true);
    const content = transcription || params.content || '';
    try {
      const analysis = await openAiService.analyzePrayerContent(
        content,
        !!transcription,
        userOptInFlags.optInAI,
      );
      setTitle(analysis.title);
      setContent(analysis.cleanedTranscription || content);

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

  useEffect(() => {
    if (isTranscribing) {
      setPlaceholder('Transcribing...');
    } else if (transcription || params.content) {
      if (transcription) {
        setContent(transcription);
      }
      analyzeContent();
    } else if (transcription === '') {
      setPlaceholder('Transcription unavailable');
    }
  }, [analyzeContent, isTranscribing, params.content, transcription]);

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
            if (!prayerId || !auth.currentUser?.uid) {
              Alert.alert('Error', 'Cannot delete prayer');
              return;
            }

            setIsDeleting(true);
            try {
              await prayerService.deletePrayer(prayerId, auth.currentUser.uid);
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
    if (!title.trim()) {
      // Generate a title from the first few words of content if title is empty
      setTitle(content.split(' ').slice(0, 3).join(' ') || 'Untitled Prayer');
    }

    if (!auth.currentUser?.uid) {
      Alert.alert('Error', 'You must be logged in to create a prayer');
      return;
    }

    setPrivacy('private'); // temporary set function to bypass lint for now.
    setIsLoading(true);
    try {
      if (isEditMode && prayerId) {
        // Update existing prayer
        const updateData: UpdatePrayerDTO = {
          title: title.trim(),
          content: content,
          privacy: privacy,
          // We've removed tags completely
        };

        await prayerService.updatePrayer(prayerId, updateData);
        Alert.alert('Success', 'Prayer updated successfully');
        router.push('/(tabs)/(prayers)');
      } else {
        // Create new prayer
        const prayerData: CreatePrayerDTO = {
          title: title.trim(),
          content: content,
          privacy: privacy,
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
      {/* 1. Prayer Points Section with Summary Header */}
      <View style={styles.section}>
        <ThemedText type="default" style={styles.headerText}>
          Here's a summary of what you prayed:
        </ThemedText>
        <PrayerPointSection
          prayerPoints={prayerPoints}
          onChange={(updatedPrayerPoints: PrayerPoint[]) =>
            setPrayerPoints(updatedPrayerPoints)
          }
        />
      </View>

      {/* 3. Prayer Content Section with Title */}
      <View style={styles.section}>
        <ThemedText type="default" style={styles.headerText}>
          Prayer
        </ThemedText>
        <View style={styles.contentContainer}>
          <TextInput
            style={styles.contentInput}
            placeholder={placeholder}
            value={content}
            onChangeText={setContent}
            multiline
          />
          {isTranscribing && <ActivityIndicator color="#9747FF" size="small" />}
          {isAnalyzing && (
            <ActivityIndicator
              color={Colors.primary}
              size="small"
              style={styles.activityIndicator}
            />
          )}
        </View>
      </View>

      {/* Spacer view to push content up and button to bottom */}
      <View style={styles.spacer} />

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

  contentContainer: {
    position: 'relative',
  },
  contentInput: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 120,
    padding: 12,
    textAlignVertical: 'top',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: Colors.purple,
    borderRadius: 12,
    height: 60, // Fixed height to match the submit button
    marginTop: 10,
    padding: 16,
  },
  deleteButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
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
  // Add a spacer that will push content up and buttons to the bottom
  spacer: {
    flex: 1,
    minHeight: 20, // Minimum height to ensure some spacing even when content is long
  },
});
