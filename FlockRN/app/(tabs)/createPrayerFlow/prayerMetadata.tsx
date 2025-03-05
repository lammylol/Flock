import { useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
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
  const [selectedTags, setSelectedTags] = useState<PrayerTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { handleRecordPrayer, transcription } = useRecording();

  // Update content when transcription is available
  useEffect(() => {
    if (transcription) setContent(transcription);
  }, [transcription]);

  const handleAIFill = async () => {
    if (!content) {
      Alert.alert('Error', 'No prayer content to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzePrayerContent(content);
      setTitle(analysis.title);
      setSelectedTags(analysis.tags);
    } catch (error) {
      console.error('Error using AI fill:', error);
      Alert.alert(
        'Error',
        'Failed to analyze prayer. Please try again or fill manually.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <TextInput
          style={[styles.input, styles.titleInput]}
          placeholder="prayer title"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <TouchableOpacity
          style={[styles.aiButton, isAnalyzing && styles.aiButtonDisabled]}
          onPress={handleAIFill}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.aiButtonText}>AI Fill</ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.previewContainer}>
        <ThemedText style={styles.label}>Prayer Content:</ThemedText>
        <TextInput
          style={styles.previewText}
          placeholder={
            transcription === 'transcription unavailable'
              ? 'transcription unavailable'
              : ''
          }
          value={content}
          onChangeText={setContent}
          multiline
        />
      </ThemedView>

      <ThemedView style={styles.tagsContainer}>
        <ThemedText style={styles.label}>Tags:</ThemedText>
        <ThemedView style={styles.tagButtons}>
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
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.pickerContainer}>
        <ThemedText style={styles.label}>Privacy:</ThemedText>
        <Picker
          selectedValue={privacy}
          onValueChange={(value: 'public' | 'private') => setPrivacy(value)}
          style={styles.picker}
        >
          <Picker.Item label="Private" value="private" />
          <Picker.Item label="Public" value="public" />
        </Picker>
      </ThemedView>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCreatePrayer}
        disabled={isLoading}
      >
        <ThemedText style={styles.buttonText}>
          {isLoading ? 'Creating...' : 'Create Prayer'}
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  aiButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 80,
    padding: 12,
  },
  aiButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 16,
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    marginBottom: 100,
    padding: 20,
  },
  input: {
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    padding: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  picker: {
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewText: {
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    padding: 12,
  },
  recordingButton: {
    alignItems: 'center',
    backgroundColor: '#FF0000',
    borderRadius: 8,
    marginBottom: 32,
    marginTop: 16,
    padding: 16,
  },
  tagButton: {
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    padding: 8,
    paddingHorizontal: 16,
  },
  tagButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    gap: 8,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  titleInput: {
    flex: 1,
    marginBottom: 0,
  },
});
