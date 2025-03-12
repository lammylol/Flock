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
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { CreatePrayerDTO, PrayerTag } from '@/types/firebase';
import useRecording from '@/hooks/recording/useRecording';

const PRAYER_TAGS: PrayerTag[] = [
  'Family',
  'Friends',
  'Finances',
  'Career',
  'Health',
];

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
  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    // Automatically perform AI fill when content is available after navigation
    const autoFillMetadata = async () => {
      if (content && !title) {
        setIsAnalyzing(true);
        try {
          const analysis = await analyzePrayerContent(content, !!transcription);
          setTitle(analysis.title);
          setContent(analysis.cleanedTranscription || content);
          setSelectedTags(analysis.tags);
        } catch (error) {
          console.error('Error using AI fill:', error);
          // Silent fail - don't show error to user for automatic fill
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    autoFillMetadata();
  }, [content, transcription]);

  // Make sure transcription is used when available
  useEffect(() => {
    if (isTranscribing) {
      setPlaceholder('Transcribing...');
    } else if (content === '' && !transcription) {
      setPlaceholder('transcription unavailable');
    } else if (transcription) {
      setContent(transcription);
    }
  }, [isTranscribing, transcription]);

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
        status: 'Current' as const,
        isPinned: false,
      } as CreatePrayerDTO;

      await prayerService.createPrayer(prayerData);
      Alert.alert('Success', 'Prayer created successfully');
      router.push('/prayer');
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
            style={[styles.modalOption, privacy === 'private' && styles.selectedOption]}
            onPress={() => {
              setPrivacy('private');
              setShowPrivacyModal(false);
            }}
          >
            <ThemedText style={styles.modalOptionText}>Private</ThemedText>
            {privacy === 'private' && <ThemedText>✓</ThemedText>}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modalOption, privacy === 'public' && styles.selectedOption]}
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
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.titleContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder="Prayer title"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            {isAnalyzing && (
              <ActivityIndicator color="#9747FF" size="small" />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <TextInput
            style={styles.contentInput}
            placeholder="Enter your prayer here..."
            value={content}
            onChangeText={setContent}
            multiline
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Tags:</ThemedText>
          <View style={styles.tagButtons}>
            {PRAYER_TAGS.map((tag) => (
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
              {privacy === 'private' && <ThemedText style={styles.lockIcon}>🔒</ThemedText>}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.reminderContainer}>
            <View style={styles.reminderLeft}>
              <ThemedText style={styles.label}>📅 Enable Reminders</ThemedText>
            </View>
            <View style={styles.switchContainer}>
              {/* Replace with actual Switch component */}
              <View style={styles.switchOff} />
            </View>
          </View>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleInput: {
    flex: 1,
    backgroundColor: Colors.secondary, // Same beige as prayer screen
    borderRadius: 8,
    fontSize: 16,
    padding: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  contentInput: {
    backgroundColor: Colors.secondary, // Same beige as prayer screen
    borderRadius: 8,
    fontSize: 16,
    padding: 12,
    paddingTop: 12,
    minHeight: 120,
  },
  tagButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  tagButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
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
  privacySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privacyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyValue: {
    fontSize: 16,
    color: '#000',
    marginRight: 4,
  },
  lockIcon: {
    fontSize: 16,
  },
  reminderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchContainer: {
    width: 40,
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    padding: 2,
  },
  switchOff: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
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
  createButton: {
    alignItems: 'center',
    backgroundColor: '#9747FF',
    borderRadius: 30,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: '#D1C4E9',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#f8f8f8',
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  modalCloseText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});