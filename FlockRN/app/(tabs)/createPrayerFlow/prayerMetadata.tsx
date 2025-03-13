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
import { CreatePrayerDTO, PrayerTag, UpdatePrayerDTO } from '@/types/firebase';
import useRecording from '@/hooks/recording/useRecording';

const PRAYER_TAGS: PrayerTag[] = [
  'Family',
  'Friends',
  'Finances',
  'Career',
  'Health',
];

export default function PrayerMetadataScreen() {
  const params = useLocalSearchParams<{ 
    content?: string, 
    id?: string, 
    title?: string, 
    privacy?: string, 
    tags?: string, 
    mode?: string 
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
  const [privacy, setPrivacy] = useState<'public' | 'private'>(
    (params?.privacy as 'public' | 'private') || 'private'
  );
  const [selectedTags, setSelectedTags] = useState<PrayerTag[]>(initialTags);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { transcription, isTranscribing } = useRecording();
  const [placeholder, setPlaceholder] = useState('');

  // Update content when transcription is available
  useEffect(() => {
    if (isTranscribing) {
      setPlaceholder('Transcribing...');
    } else if (content === '' && !transcription) {
      setPlaceholder('transcription unavailable');
    } else if (transcription && !isEditMode) {
      // Only set from transcription in create mode
      setContent(transcription);
    }
  }, [isTranscribing, transcription, isEditMode, content]);

  const handleAIFill = async () => {
    if (!content) {
      Alert.alert('Error', 'No prayer content to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzePrayerContent(content, !!transcription);
      setTitle(analysis.title);
      setContent(analysis.cleanedTranscription || content);
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
      } else {
        // Create new prayer
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
      }
      
      // Navigate back to prayer list
      router.push('/prayer');
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} prayer:`, error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} prayer. Please try again.`);
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
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <ThemedText style={styles.aiButtonText}>AI Fill</ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.previewContainer}>
        <ThemedText style={styles.label}>Prayer Content:</ThemedText>
        <TextInput
          style={styles.previewText}
          placeholder={placeholder}
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
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <ThemedText style={styles.buttonText}>
          {isLoading 
            ? (isEditMode ? 'Updating...' : 'Creating...') 
            : (isEditMode ? 'Update Prayer' : 'Create Prayer')}
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
    color: Colors.white,
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
    color: Colors.white,
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
    color: Colors.white,
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