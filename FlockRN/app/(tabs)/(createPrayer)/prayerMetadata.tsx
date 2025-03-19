import { useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  View,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { prayerService } from '@/services/prayer/prayerService';
import { analyzePrayerContent } from '../../../services/ai/openAIService';
import { auth } from '../../../firebase/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import {
  CreatePrayerDTO,
  PrayerPoint,
  PrayerPointDTO,
  PrayerTag,
  UpdatePrayerDTO,
} from '@/types/firebase';
import useRecording from '@/hooks/recording/useRecording';
import { allTags } from '@/types/Tag';

export default function PrayerMetadataScreen() {
  const textContent = useLocalSearchParams<{ content?: string }>();
  const [content, setContent] = useState(textContent?.content || '');
  const [title, setTitle] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  // Privacy Modal
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<PrayerTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { transcription, isTranscribing } = useRecording();
  const [placeholder, setPlaceholder] = useState('enter your prayer here');
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);

  useEffect(() => {
    if (isTranscribing) {
      setPlaceholder('Transcribing...');
    } else if (transcription) {
      setContent(transcription); // This will trigger the next useEffect
    } else if (content === '') {
      setPlaceholder('transcription unavailable');
    }
  }, [isTranscribing, transcription]);

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
        const analysis = await analyzePrayerContent(content, !!transcription);
        setTitle(analysis.title);
        setContent(analysis.cleanedTranscription || content);
        setSelectedTags(analysis.tags);
        setPrayerPoints(analysis.prayerPoints);
      } catch (error) {
        console.error('Error using AI fill:', error);
        // Silent fail - don't show error to user for automatic fill
      } finally {
        setIsAnalyzing(false);
      }
    };
    // Perform AI fill when content is available after navigation, but after 4 seconds.
    // This ensures that the full transcription is returned before before processing with AI.
    if (content && !title && !isTranscribing) {
      analyzeContent();
    }
  }, [content, transcription]);

  const toggleTag = (tag: PrayerTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCreatePrayer = async () => {
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
      const prayerData = {
        title: title.trim(),
        content: content,
        privacy: privacy,
        tags: selectedTags,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName,
        status: 'open' as const,
        isPinned: false,
      } as unknown as CreatePrayerDTO;

      const prayerId = await prayerService.createPrayer(prayerData);

      // get list of prayer point ids
      const prayerPointIds = await handlePrayerPoints(prayerPoints, prayerId);

      const updatePrayerPoints = {
        prayerPoints: prayerPointIds,
      } as UpdatePrayerDTO;

      // update the original prayer with the list of ids
      await prayerService.updatePrayer(prayerId, updatePrayerPoints);

      Alert.alert('Success', 'Prayer created successfully');
      router.push('/(tabs)/(prayers)');
    } catch (error) {
      console.error('Error creating prayer:', error);
      Alert.alert('Error', 'Failed to create prayer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Return the Modal component at the end of the component
  const PrivacyModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showPrivacyModal}
      onRequestClose={() => setShowPrivacyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>Privacy Settings</ThemedText>

          <TouchableOpacity
            style={[
              styles.modalOption,
              privacy === 'private' && styles.selectedOption,
            ]}
            onPress={() => {
              setPrivacy('private');
              setShowPrivacyModal(false);
            }}
          >
            <ThemedText style={styles.modalOptionText}>Private</ThemedText>
            {privacy === 'private' && <ThemedText>✓</ThemedText>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modalOption,
              privacy === 'public' && styles.selectedOption,
            ]}
            onPress={() => {
              setPrivacy('public');
              setShowPrivacyModal(false);
            }}
          >
            <ThemedText style={styles.modalOptionText}>Public</ThemedText>
            {privacy === 'public' && <ThemedText>✓</ThemedText>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowPrivacyModal(false)}
          >
            <ThemedText style={styles.modalCloseText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <View style={styles.titleContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder="Prayer title"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            {isAnalyzing && <ActivityIndicator color="#9747FF" size="small" />}
          </View>
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
            {isTranscribing && (
              <ActivityIndicator color="#9747FF" size="small" />
            )}
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
                  selectedTags.includes(tag) && styles.tagButtonSelected,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <ThemedText
                  style={[
                    styles.tagButtonText,
                    selectedTags.includes(tag) && styles.tagButtonTextSelected,
                  ]}
                >
                  {tag}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.privacySelector}
            onPress={() => setShowPrivacyModal(true)}
          >
            <ThemedText style={styles.label}>Privacy</ThemedText>
            <View style={styles.privacyValueContainer}>
              <ThemedText style={styles.privacyValue}>
                {privacy === 'private' ? 'Private' : 'Public'}
              </ThemedText>
              {privacy === 'private' && (
                <ThemedText style={styles.lockIcon}>🔒</ThemedText>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.buttonDisabled]}
          onPress={handleCreatePrayer}
          disabled={isLoading}
        >
          <ThemedText style={styles.createButtonText}>
            {isLoading ? 'Creating...' : 'Add Prayer'}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>

      <PrivacyModal />
    </>
  );
}

const styles = StyleSheet.create({
  aiButton: {
    alignItems: 'center',
    backgroundColor: '#9747FF',
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 80,
    padding: 12,
  },
  aiButtonDisabled: {
    backgroundColor: '#D1C4E9',
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#D1C4E9',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  contentInput: {
    backgroundColor: Colors.secondary, // Same beige as prayer screen
    borderRadius: 8,
    fontSize: 16,
    padding: 12,
    paddingTop: 12,
    minHeight: 120,
    flex: 1,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: '#9747FF',
    borderRadius: 30,
    marginBottom: 16,
    marginTop: 8,
    padding: 16,
  },
  createButtonText: {
    color: '#fff',
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
  modalCloseButton: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 16,
    padding: 16,
  },
  modalCloseText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalOption: {
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  privacySelector: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  privacyValue: {
    color: '#000',
    fontSize: 16,
    marginRight: 4,
  },
  privacyValueContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  selectedOption: {
    backgroundColor: '#f8f8f8',
  },
  switchContainer: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    height: 24,
    padding: 2,
    width: 40,
  },
  switchOff: {
    backgroundColor: '#fff',
    borderRadius: 10,
    height: 20,
    width: 20,
  },
  tagButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagButtonSelected: {
    backgroundColor: '#9747FF',
  },
  tagButtonText: {
    fontSize: 14,
  },
  tagButtonTextSelected: {
    color: '#fff',
  },
  tagButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  titleInput: {
    flex: 1,
    backgroundColor: Colors.secondary, // Same beige as prayer screen
    borderRadius: 8,
    fontSize: 16,
    padding: 12,
  },
});
