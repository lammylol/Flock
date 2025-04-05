import React, { useEffect, useState } from 'react';
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
  PrayerPointDTO,
  PrayerTag,
  UpdatePrayerDTO,
} from '@/types/firebase';
import useRecording from '@/hooks/recording/useRecording';
import { allTags } from '@/types/Tag';
import PrayerPointSection from '@/components/Prayer/PrayerPoints/PrayerPointSection';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { transcription, isTranscribing } = useRecording();
  const [placeholder, setPlaceholder] = useState('Enter your prayer here');
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);

  useEffect(() => {
    if (isTranscribing) {
      setPlaceholder('Transcribing...');
    } else if (transcription) {
      setContent(transcription);
    } else if (content === '') {
      setPlaceholder('Transcription unavailable');
    }
  }, [content, isTranscribing, transcription]);

  const handlePrayerPoints = async (
    prayerPoints: PrayerPoint[],
    prayerId: string,
  ): Promise<string[]> => {
    try {
      // Transform prayer points
      const mappedPrayerPoints: PrayerPointDTO[] = prayerPoints.map(
        (prayerPoint) => ({
          title: prayerPoint.title?.trim() || 'Untitled',
          type: (prayerPoint.type?.trim() as 'request' | 'praise') || 'request',
          content: prayerPoint.content?.trim() || '',
          createdAt: new Date(),
          authorId: auth.currentUser?.uid || 'unknown',
          authorName: auth.currentUser?.displayName || 'Unknown',
          status: prayerPoint.status || 'open',
          privacy: prayerPoint.privacy ?? 'private',
          prayerId: prayerId,
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

  useEffect(() => {
    const analyzeContent = async () => {
      setIsAnalyzing(true);
      try {
        const analysis = await openAiService.analyzePrayerContent(
          content,
          !!transcription,
          userOptInFlags.optInAI,
        );
        setTitle(analysis.title);
        setContent(analysis.cleanedTranscription || content);
        setSelectedTags(analysis.tags);

        // Assign a UUID if the prayer point doesn't already have an ID
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
    };
    // Perform AI fill when content is available after navigation, but after 4 seconds.
    // This ensures that the full transcription is returned before before processing with AI.
    if (content && !title && !isTranscribing && userOptInFlags.optInAI) {
      analyzeContent();
    }
  }, [
    content,
    isTranscribing,
    openAiService,
    title,
    transcription,
    userOptInFlags.optInAI,
  ]);

  const toggleTag = (tag: PrayerTag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag],
    );
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
        // Update existing prayer
        const updateData: UpdatePrayerDTO = {
          title: title.trim(),
          content: content,
          privacy: privacy,
          tags: selectedTags,
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
          tags: selectedTags,
          authorId: auth.currentUser.uid,
          authorName: auth.currentUser.displayName ?? 'Unknown',
          status: 'open',
          isPinned: false,
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
      <View style={styles.section}>
        <TextInput
          style={styles.titleInput}
          placeholder="Prayer title"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        {isAnalyzing && (
          <ActivityIndicator
            color={Colors.primary}
            size="small"
            style={styles.activityIndicator}
          />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.titleContainer}>
          <TextInput
            style={styles.contentInput}
            placeholder={placeholder}
            value={content}
            onChangeText={setContent}
            multiline
          />
          {isTranscribing && <ActivityIndicator color="#9747FF" size="small" />}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.label}>Tags:</ThemedText>
        <View style={styles.tagButtons}>
          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagButton,
                {
                  backgroundColor: selectedTags.includes(tag)
                    ? Colors.tagColors.selectedColors[tag] || Colors.primary
                    : Colors.tagColors.defaultTag,
                },
              ]}
              onPress={() => toggleTag(tag)}
            >
              <ThemedText
                style={[
                  styles.tagButtonText,
                  {
                    color: selectedTags.includes(tag)
                      ? Colors.white
                      : Colors.light.textPrimary,
                  },
                ]}
              >
                {tag}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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

      <PrayerPointSection
        prayerPoints={prayerPoints}
        editable={true}
        onChange={(updatedPrayerPoints: PrayerPoint[]) =>
          setPrayerPoints(updatedPrayerPoints)
        }
      />

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
    backgroundColor: Colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    flex: 1,
    gap: 8,
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
  },
  contentInput: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: 'top',
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
  tagButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagButtonText: {
    fontSize: 14,
  },
  tagButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  titleContainer: {},
  titleInput: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    fontSize: 16,
  },
});
